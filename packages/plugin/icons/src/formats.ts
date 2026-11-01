/**
 * ICNS entry types that hold PNG data, with the pixel size of each.
 * Retina (`@2x`) variants reuse the PNG of the next size up.
 */
export const ICNS_TYPES: { type: string; size: number }[] = [
  { type: 'icp4', size: 16 },
  { type: 'icp5', size: 32 },
  { type: 'ic11', size: 32 }, // 16@2x
  { type: 'icp6', size: 64 },
  { type: 'ic12', size: 64 }, // 32@2x
  { type: 'ic07', size: 128 },
  { type: 'ic08', size: 256 },
  { type: 'ic13', size: 256 }, // 128@2x
  { type: 'ic09', size: 512 },
  { type: 'ic14', size: 512 }, // 256@2x
  { type: 'ic10', size: 1024 }, // 512@2x
];

/** Sizes embedded in the Windows `.ico` file. */
export const ICO_SIZES = [16, 24, 32, 48, 64, 128, 256];

/**
 * Builds an Apple Icon Image (`.icns`) file from PNG-encoded images.
 */
export function buildIcns(pngBySize: Map<number, Buffer>): Buffer {
  const entries: Buffer[] = [];
  for (const { type, size } of ICNS_TYPES) {
    const png = pngBySize.get(size);
    if (!png) continue;
    const header = Buffer.alloc(8);
    header.write(type, 0, 'latin1');
    header.writeUInt32BE(png.length + 8, 4);
    entries.push(header, png);
  }
  const body = Buffer.concat(entries);
  const header = Buffer.alloc(8);
  header.write('icns', 0, 'latin1');
  header.writeUInt32BE(body.length + 8, 4);
  return Buffer.concat([header, body]);
}

/**
 * Builds a Windows icon (`.ico`) file with PNG-compressed images, which
 * Windows Vista and later support at every size.
 */
export function buildIco(pngBySize: Map<number, Buffer>): Buffer {
  const sizes = ICO_SIZES.filter((size) => pngBySize.has(size));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(sizes.length, 4);

  const directory = Buffer.alloc(16 * sizes.length);
  let offset = header.length + directory.length;
  const images: Buffer[] = [];

  sizes.forEach((size, i) => {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const png = pngBySize.get(size)!;
    const entry = i * 16;
    directory[entry] = size >= 256 ? 0 : size; // 0 means 256
    directory[entry + 1] = size >= 256 ? 0 : size;
    directory[entry + 2] = 0; // palette colors
    directory[entry + 3] = 0; // reserved
    directory.writeUInt16LE(1, entry + 4); // color planes
    directory.writeUInt16LE(32, entry + 6); // bits per pixel
    directory.writeUInt32LE(png.length, entry + 8);
    directory.writeUInt32LE(offset, entry + 12);
    offset += png.length;
    images.push(png);
  });

  return Buffer.concat([header, directory, ...images]);
}
