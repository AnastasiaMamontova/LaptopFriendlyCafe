import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const res = resolve(root, 'android/app/src/main/res');
const source = await readFile(resolve(root, 'public/icon.svg'));

// Reuse the PWA artwork so the launcher and Android splash match the app.
for (const [density, scale] of Object.entries({ mdpi: 1, hdpi: 1.5, xhdpi: 2, xxhdpi: 3, xxxhdpi: 4 })) {
  const folder = resolve(res, `mipmap-${density}`);
  const icon = await sharp(source).resize(48 * scale, 48 * scale).png().toBuffer();
  await writeFile(resolve(folder, 'ic_launcher.png'), icon);
  await writeFile(resolve(folder, 'ic_launcher_round.png'), icon);
  const canvas = Math.round(108 * scale);
  const glyph = Math.round(64 * scale);
  await sharp({ create: { width: canvas, height: canvas, channels: 4, background: '#e7d4f1' } })
    .composite([{ input: await sharp(source).resize(glyph, glyph).png().toBuffer(), gravity: 'center' }])
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
