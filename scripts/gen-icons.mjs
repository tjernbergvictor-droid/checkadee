import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(__dirname, '..', 'public', 'icons');
const src = path.join(iconsDir, 'source.svg');

async function main() {
  await sharp(src).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  await sharp(src).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  await sharp(src).resize(180, 180).png().toFile(path.join(iconsDir, 'apple-touch-icon.png'));

  const maskableSize = 512;
  const pad = Math.round(maskableSize * 0.1);
  await sharp({
    create: {
      width: maskableSize,
      height: maskableSize,
      channels: 4,
      background: '#211E1A',
    },
  })
    .composite([{ input: await sharp(src).resize(maskableSize - pad * 2, maskableSize - pad * 2).toBuffer(), top: pad, left: pad }])
    .png()
    .toFile(path.join(iconsDir, 'icon-512-maskable.png'));

  console.log('Icons generated.');
}

main();
