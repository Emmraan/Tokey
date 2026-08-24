/**
 * Generates PNG icon set for PWA from the TOKEY brand tile.
 * Run: node scripts/generate-icons.mjs   (requires: pnpm add -D sharp)
 *
 * Sources are inline to keep the script self-contained.
 * Keep visuals in sync with app/icon.svg (rounded zinc shield tile).
 */
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const SHIELD_PATH =
  'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1 1 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z';

function tileSvg({ size, radius, padRatio }) {
  const pad = Math.round(size * padRatio);
  const inner = size - pad * 2;
  const scale = inner / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${radius}" fill="#27272a"/>
  <rect x="1" y="1" width="${size - 2}" height="${size - 2}" rx="${Math.max(radius - 1, 0)}" fill="none" stroke="#3f3f46" stroke-opacity="0.9" stroke-width="2"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path d="${SHIELD_PATH}" fill="none" stroke="#f4f4f5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

// Full-bleed square with generous safe zone (maskable icons / apple-touch-icon).
function fullBleedSvg({ size, contentRatio = 0.56 }) {
  const inner = Math.round(size * contentRatio);
  const pad = Math.round((size - inner) / 2);
  const scale = inner / 24;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="#27272a"/>
  <g transform="translate(${pad} ${pad}) scale(${scale})">
    <path d="${SHIELD_PATH}" fill="none" stroke="#f4f4f5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

async function render(svg, file, size) {
  await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toFile(file);
  console.log(`✓ ${file}`);
}

const outDir = path.resolve('public/icons');
await mkdir(outDir, { recursive: true });

const any192 = tileSvg({ size: 512, radius: 112, padRatio: 0.125 });
const maskable = fullBleedSvg({ size: 512 });
const apple = fullBleedSvg({ size: 512, contentRatio: 0.62 });

await render(any192, path.join(outDir, 'icon-192.png'), 192);
await render(any192, path.join(outDir, 'icon-512.png'), 512);
await render(maskable, path.join(outDir, 'maskable-192.png'), 192);
await render(maskable, path.join(outDir, 'maskable-512.png'), 512);
await render(apple, path.join(outDir, 'apple-touch-icon.png'), 180);

console.log('Icon generation complete.');
