/**
 * Generates PNG app icons (a soft warm orb on near-black) with zero
 * dependencies: raw RGBA pixels hand-encoded into PNG via node:zlib.
 * Run: npm run icons  (outputs to public/)
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');
mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let table = crc32.table;
  if (!table) {
    table = crc32.table = new Int32Array(256).map((_, n) => {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      return c;
    });
  }
  let crc = -1;
  for (const b of buf) crc = (crc >>> 8) ^ table[(crc ^ b) & 0xff];
  return (crc ^ -1) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(size, pixels) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function lerp(a, b, u) {
  return a + (b - a) * u;
}

function makeIcon(size) {
  const px = Buffer.alloc(size * size * 4);
  const cx = size * 0.5;
  const cy = size * 0.52;
  const orbR = size * 0.23;
  const haloR = size * 0.42;
  // Little star accent
  const sx = size * 0.66;
  const sy = size * 0.26;
  const starR = size * 0.045;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      // Background: deep night
      let r = 7, g = 8, b = 13;
      const d = Math.hypot(x - cx, y - cy);
      if (d < haloR) {
        const u = 1 - d / haloR;
        const halo = u * u * 0.5;
        r = lerp(r, 255, halo * 0.35);
        g = lerp(g, 210, halo * 0.35);
        b = lerp(b, 125, halo * 0.35);
      }
      if (d < orbR) {
        const hx = (x - (cx - orbR * 0.25)) / orbR;
        const hy = (y - (cy - orbR * 0.3)) / orbR;
        const hd = Math.min(Math.hypot(hx, hy), 1);
        r = lerp(255, 122, hd * hd * 0.9);
        g = lerp(233, 85, hd * hd * 0.9);
        b = lerp(184, 24, hd * hd * 0.9);
      }
      const sd = Math.abs(x - sx) + Math.abs(y - sy); // diamond star
      if (sd < starR) {
        const u = 1 - sd / starR;
        r = lerp(r, 255, u);
        g = lerp(g, 233, u);
        b = lerp(b, 184, u);
      }
      px[i] = Math.round(r);
      px[i + 1] = Math.round(g);
      px[i + 2] = Math.round(b);
      px[i + 3] = 255;
    }
  }
  return encodePng(size, px);
}

for (const size of [512, 192, 180]) {
  const name = size === 180 ? 'icon-180.png' : `icon-${size}.png`;
  writeFileSync(join(outDir, name), makeIcon(size));
  console.log(`wrote public/${name}`);
}
