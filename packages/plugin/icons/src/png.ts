import zlib from 'node:zlib';

/** An 8-bit-per-channel RGBA bitmap. */
export interface Bitmap {
  width: number;
  height: number;
  /** `width * height * 4` bytes, row-major, RGBA. */
  data: Uint8Array;
}

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

const CHANNELS: Record<number, number> = {
  0: 1, // grayscale
  2: 3, // RGB
  3: 1, // palette
  4: 2, // grayscale + alpha
  6: 4, // RGBA
};

/**
 * Decodes a non-interlaced 8-bit PNG (grayscale, RGB, palette, with or
 * without alpha) into RGBA. That covers what design tools export for app
 * icons; 16-bit and interlaced PNGs are rejected with a clear error.
 */
export function decodePng(file: Uint8Array): Bitmap {
  const buf = Buffer.from(file.buffer, file.byteOffset, file.byteLength);
  if (!buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    throw new Error('Icon source is not a PNG file');
  }

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  let palette: Buffer | undefined;
  let transparency: Buffer | undefined;
  const idat: Buffer[] = [];

  while (offset < buf.length) {
    const length = buf.readUInt32BE(offset);
    const type = buf.toString('latin1', offset + 4, offset + 8);
    const chunk = buf.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;

    if (type === 'IHDR') {
      width = chunk.readUInt32BE(0);
      height = chunk.readUInt32BE(4);
      bitDepth = chunk[8];
      colorType = chunk[9];
      interlace = chunk[12];
    } else if (type === 'PLTE') {
      palette = chunk;
    } else if (type === 'tRNS') {
      transparency = chunk;
    } else if (type === 'IDAT') {
      idat.push(chunk);
    } else if (type === 'IEND') {
      break;
    }
  }

  if (bitDepth !== 8) {
    throw new Error(
      `Icon source must be an 8-bit PNG (got ${bitDepth}-bit). Re-export it as 8-bit RGBA.`,
    );
  }
  if (interlace !== 0) {
    throw new Error('Icon source must not be an interlaced PNG.');
  }
  const channels = CHANNELS[colorType];
  if (!channels) {
    throw new Error(`Unsupported PNG color type ${colorType}`);
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = new Uint8Array(stride * height);
  let prev = new Uint8Array(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    const out = pixels.subarray(y * stride, (y + 1) * stride);
    for (let x = 0; x < stride; x++) {
      const left = x >= channels ? out[x - channels] : 0;
      const up = prev[x];
      const upLeft = x >= channels ? prev[x - channels] : 0;
      let value = line[x];
      switch (filter) {
        case 0:
          break;
        case 1:
          value += left;
          break;
        case 2:
          value += up;
          break;
        case 3:
          value += (left + up) >> 1;
          break;
        case 4:
          value += paeth(left, up, upLeft);
          break;
        default:
          throw new Error(`Corrupt PNG: unknown filter type ${filter}`);
      }
      out[x] = value & 0xff;
    }
    prev = out;
  }

  const data = new Uint8Array(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += channels) {
    const o = i * 4;
    switch (colorType) {
      case 0: {
        const g = pixels[p];
        data[o] = data[o + 1] = data[o + 2] = g;
        data[o + 3] =
          transparency && transparency.readUInt16BE(0) === g ? 0 : 255;
        break;
      }
      case 2: {
        data[o] = pixels[p];
        data[o + 1] = pixels[p + 1];
        data[o + 2] = pixels[p + 2];
        data[o + 3] =
          transparency &&
          transparency.readUInt16BE(0) === pixels[p] &&
          transparency.readUInt16BE(2) === pixels[p + 1] &&
          transparency.readUInt16BE(4) === pixels[p + 2]
            ? 0
            : 255;
        break;
      }
      case 3: {
        const index = pixels[p];
        if (!palette || index * 3 + 2 >= palette.length) {
          throw new Error('Corrupt PNG: palette index out of range');
        }
        data[o] = palette[index * 3];
        data[o + 1] = palette[index * 3 + 1];
        data[o + 2] = palette[index * 3 + 2];
        data[o + 3] =
          transparency && index < transparency.length
            ? transparency[index]
            : 255;
        break;
      }
      case 4:
        data[o] = data[o + 1] = data[o + 2] = pixels[p];
        data[o + 3] = pixels[p + 1];
        break;
      case 6:
        data[o] = pixels[p];
        data[o + 1] = pixels[p + 1];
        data[o + 2] = pixels[p + 2];
        data[o + 3] = pixels[p + 3];
        break;
    }
  }

  return { width, height, data };
}

function chunk(type: string, body: Uint8Array): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(body.length, 0);
  header.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([header.subarray(4), body])), 0);
  return Buffer.concat([header, body, crc]);
}

/** Encodes an RGBA bitmap as a PNG. */
export function encodePng({ width, height, data }: Bitmap): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    // Filter type 0 (none) keeps the encoder simple; zlib still compresses
    // flat icon artwork well.
    raw[y * (stride + 1)] = 0;
    raw.set(data.subarray(y * stride, (y + 1) * stride), y * (stride + 1) + 1);
  }

  return Buffer.concat([
    PNG_SIGNATURE,
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

/**
 * Resizes a bitmap with an area-averaging (box) filter in premultiplied
 * alpha, which gives clean downscales from a large square source without
 * dark fringes on transparent edges.
 */
export function resize(src: Bitmap, width: number, height: number): Bitmap {
  if (src.width === width && src.height === height) {
    return { width, height, data: src.data.slice() };
  }
  const out = new Uint8Array(width * height * 4);
  const scaleX = src.width / width;
  const scaleY = src.height / height;

  for (let y = 0; y < height; y++) {
    const y0 = y * scaleY;
    const y1 = Math.min((y + 1) * scaleY, src.height);
    for (let x = 0; x < width; x++) {
      const x0 = x * scaleX;
      const x1 = Math.min((x + 1) * scaleX, src.width);
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      let total = 0;
      for (let sy = Math.floor(y0); sy < Math.ceil(y1); sy++) {
        const wy = Math.min(sy + 1, y1) - Math.max(sy, y0);
        for (let sx = Math.floor(x0); sx < Math.ceil(x1); sx++) {
          const wx = Math.min(sx + 1, x1) - Math.max(sx, x0);
          const w = wx * wy;
          const i = (sy * src.width + sx) * 4;
          const alpha = src.data[i + 3];
          r += src.data[i] * alpha * w;
          g += src.data[i + 1] * alpha * w;
          b += src.data[i + 2] * alpha * w;
          a += alpha * w;
          total += w;
        }
      }
      const o = (y * width + x) * 4;
      if (a > 0) {
        out[o] = Math.round(r / a);
        out[o + 1] = Math.round(g / a);
        out[o + 2] = Math.round(b / a);
      }
      out[o + 3] = Math.round(a / total);
    }
  }
  return { width, height, data: out };
}
