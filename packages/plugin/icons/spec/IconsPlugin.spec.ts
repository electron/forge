import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';

import { ResolvedForgeConfig } from '@electron-forge/shared-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ICNS_TYPES, ICO_SIZES } from '../src/formats';
import { generateIcons, IconsPlugin } from '../src/IconsPlugin';
import { decodePng, encodePng, resize } from '../src/png';

function gradient(size: number) {
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const o = (y * size + x) * 4;
      data[o] = x % 256;
      data[o + 1] = y % 256;
      data[o + 2] = 128;
      data[o + 3] = x < size / 2 ? 255 : 0;
    }
  }
  return { width: size, height: size, data };
}

describe('png', () => {
  it('round-trips RGBA through encode and decode', () => {
    const bitmap = gradient(32);
    const decoded = decodePng(encodePng(bitmap));
    expect(decoded.width).toEqual(32);
    expect(Buffer.from(decoded.data).equals(Buffer.from(bitmap.data))).toBe(
      true,
    );
  });

  it('decodes RGB PNGs with Sub/Up/Average/Paeth filters', () => {
    // 4×4 RGB image, one row per filter type, all pixels (10, 20, 30).
    const width = 4;
    const stride = width * 3;
    const rows: number[] = [];
    const pixel = [10, 20, 30];
    for (const filter of [1, 2, 3, 4]) {
      rows.push(filter);
      for (let x = 0; x < width; x++) {
        for (let c = 0; c < 3; c++) {
          const raw = pixel[c];
          const left = x > 0 ? raw : 0;
          const up = filter === 1 ? 0 : raw; // rows after the first have identical pixels above
          let predicted = 0;
          if (filter === 1) predicted = left;
          if (filter === 2) predicted = up;
          if (filter === 3) predicted = (left + up) >> 1;
          if (filter === 4) {
            const upLeft = x > 0 ? raw : 0;
            const p = left + up - upLeft;
            const pa = Math.abs(p - left);
            const pb = Math.abs(p - up);
            const pc = Math.abs(p - upLeft);
            predicted = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          }
          rows.push((raw - predicted) & 0xff);
        }
      }
    }
    expect(rows.length).toEqual((stride + 1) * 4);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(4, 4);
    ihdr[8] = 8;
    ihdr[9] = 2;
    const chunk = (type: string, body: Buffer) => {
      const len = Buffer.alloc(4);
      len.writeUInt32BE(body.length);
      return Buffer.concat([
        len,
        Buffer.from(type, 'latin1'),
        body,
        Buffer.alloc(4),
      ]);
    };
    const png = Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk('IHDR', ihdr),
      chunk('IDAT', zlib.deflateSync(Buffer.from(rows))),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    const decoded = decodePng(png);
    for (let i = 0; i < 16; i++) {
      expect(Array.from(decoded.data.subarray(i * 4, i * 4 + 4))).toEqual([
        10, 20, 30, 255,
      ]);
    }
  });

  it('rejects 16-bit PNGs with a helpful message', () => {
    const png = encodePng(gradient(4));
    png[8 + 8 + 8] = 16; // IHDR bit depth byte
    expect(() => decodePng(png)).toThrow(/8-bit PNG/);
  });

  it('area-averages when downscaling and keeps transparent edges clean', () => {
    const src = {
      width: 2,
      height: 2,
      data: new Uint8Array([
        255, 0, 0, 255, 0, 0, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0,
      ]),
    };
    const out = resize(src, 1, 1);
    // Half the area is opaque red, half fully transparent: colour stays pure red.
    expect(Array.from(out.data)).toEqual([255, 0, 0, 128]);
  });
});

describe('generateIcons', () => {
  let tmp: string;

  beforeEach(async () => {
    tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'forge-icons-'));
  });

  afterEach(async () => {
    await fs.rm(tmp, { recursive: true, force: true });
  });

  it('writes icns, ico and png files with every expected size', async () => {
    const source = path.join(tmp, 'icon-source.png');
    await fs.writeFile(source, encodePng(gradient(1024)));
    const out = await generateIcons(source, path.join(tmp, 'icons'));

    const icns = await fs.readFile(out.icns);
    expect(icns.toString('latin1', 0, 4)).toEqual('icns');
    expect(icns.readUInt32BE(4)).toEqual(icns.length);
    const types: string[] = [];
    for (
      let offset = 8;
      offset < icns.length;
      offset += icns.readUInt32BE(offset + 4)
    ) {
      types.push(icns.toString('latin1', offset, offset + 4));
      const png = decodePng(
        icns.subarray(offset + 8, offset + icns.readUInt32BE(offset + 4)),
      );
      const expected = ICNS_TYPES.find((t) => t.type === types.at(-1))!.size;
      expect(png.width).toEqual(expected);
    }
    expect(types).toEqual(ICNS_TYPES.map((t) => t.type));

    const ico = await fs.readFile(out.ico);
    expect(ico.readUInt16LE(2)).toEqual(1);
    expect(ico.readUInt16LE(4)).toEqual(ICO_SIZES.length);
    ICO_SIZES.forEach((size, i) => {
      const entry = 6 + i * 16;
      expect(ico[entry] || 256).toEqual(size);
      const length = ico.readUInt32LE(entry + 8);
      const offset = ico.readUInt32LE(entry + 12);
      expect(decodePng(ico.subarray(offset, offset + length)).width).toEqual(
        size,
      );
    });

    expect(decodePng(await fs.readFile(out.png)).width).toEqual(512);
  });

  it('skips regeneration when the source has not changed', async () => {
    const source = path.join(tmp, 'icon-source.png');
    await fs.writeFile(source, encodePng(gradient(1024)));
    const outDir = path.join(tmp, 'icons');
    const out = await generateIcons(source, outDir);
    const before = (await fs.stat(out.icns)).mtimeMs;
    await new Promise((r) => setTimeout(r, 20));
    await generateIcons(source, outDir);
    expect((await fs.stat(out.icns)).mtimeMs).toEqual(before);
  });

  it('rejects non-square sources and warns on small ones', async () => {
    const source = path.join(tmp, 'wide.png');
    await fs.writeFile(
      source,
      encodePng({ width: 4, height: 2, data: new Uint8Array(32) }),
    );
    await expect(generateIcons(source, path.join(tmp, 'a'))).rejects.toThrow(
      /must be square/,
    );

    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await fs.writeFile(source, encodePng(gradient(256)));
    await generateIcons(source, path.join(tmp, 'b'));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('1024×1024'));
  });
});

describe('IconsPlugin', () => {
  it('requires a source option', () => {
    expect(() => new IconsPlugin({} as never)).toThrow(/"source"/);
  });

  it('points packagerConfig.icon and unset maker options at the generated icons', async () => {
    const plugin = new IconsPlugin({ source: 'assets/icon.png' });
    const dir = path.resolve('/project');
    const config = {
      outDir: 'out',
      packagerConfig: {},
      makers: [
        { name: '@electron-forge/maker-squirrel', config: {} },
        { name: '@electron-forge/maker-dmg', config: { icon: 'custom.icns' } },
        { name: '@electron-forge/maker-deb', config: { options: {} } },
        { name: '@electron-forge/maker-rpm' },
      ],
    } as unknown as ResolvedForgeConfig;
    plugin.init(dir, config);
    const result = (await plugin.getHooks().resolveForgeConfig!(
      config,
    )) as ResolvedForgeConfig;
    const iconDir = path.join(dir, 'out', 'icons');
    expect(result.packagerConfig.icon).toEqual(path.join(iconDir, 'icon'));
    const makers = result.makers as unknown as {
      config: { setupIcon?: string; icon?: string; options: { icon?: string } };
    }[];
    expect(makers[0].config.setupIcon).toEqual(path.join(iconDir, 'icon.ico'));
    expect(makers[1].config.icon).toEqual('custom.icns');
    expect(makers[2].config.options.icon).toEqual(
      path.join(iconDir, 'icon.png'),
    );
    expect(makers[3].config.options.icon).toEqual(
      path.join(iconDir, 'icon.png'),
    );
  });
});
