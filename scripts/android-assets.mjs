import sharp from 'sharp';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const res = resolve(root, 'android/app/src/main/res');
const source = await readFile(resolve(root, 'assets/branding/cappuccino-cat.png'));
const background = '#e7d4f1';
const icons = resolve(root, 'public/icons');
await mkdir(icons, { recursive: true });

// Keep the approved artwork unchanged. Only resize it for the output format.
await sharp(source).resize(64, 64).png().toFile(resolve(root, 'public/icon.png'));
for (const size of [192, 512]) {
  await sharp(source).resize(size, size).png().toFile(resolve(icons, `cappuccino-cat-${size}.png`));
}

// Platform masks crop the outer background; the cup and cat remain in the safe
// circle. The circular foreground also avoids a second rounded-square frame.
async function roundArtwork(size) {
  const mask = Buffer.from(`<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="white"/></svg>`);
  return sharp(source).resize(size, size).ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}
await sharp({ create: { width: 512, height: 512, channels: 4, background } })
  .composite([{ input: await roundArtwork(416), gravity: 'center' }])
  .png().toFile(resolve(icons, 'cappuccino-cat-maskable-512.png'));

for (const [density, scale] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
  const folder = resolve(res, `mipmap-${density}`);
  await mkdir(folder, { recursive: true });
  const size = Math.round(48 * scale);
  await sharp(source).resize(size, size).png().toFile(resolve(folder, 'ic_launcher.png'));
  await writeFile(resolve(folder, 'ic_launcher_round.png'), await roundArtwork(size));
  const canvas = Math.round(108 * scale);
  // 70 dp keeps the entire cup and handle within the 66 dp Android safe circle.
  const glyph = Math.round(70 * scale);
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background } })
    .composite([{ input: await roundArtwork(glyph), gravity: 'center' }])
    .png().toFile(resolve(folder, 'ic_launcher_foreground.png'));
}

for (const folder of await readdir(res)) {
  if (!folder.startsWith('drawable')) continue;
  const file = resolve(res, folder, 'splash.png');
  try {
    const { width, height } = await sharp(file).metadata();
    const size = Math.round(Math.min(width, height) * 0.25);
    const output = await sharp({ create: { width, height, channels: 4, background: '#fffaf7' } })
      .composite([{ input: await sharp(source).resize(size, size).png().toBuffer(), gravity: 'center' }])
      .png().toBuffer();
    await writeFile(file, output);
  } catch (error) {
    if (error.code !== 'ENOENT' && !String(error.message).includes('Input file is missing')) throw error;
  }
}
console.log('Updated browser, PWA, Android launcher and splash artwork. No APK was built.');
