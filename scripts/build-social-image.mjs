// Gera assets/social/calendario-do-corre-<ano>.jpg (1200x630), a imagem das prévias de link,
// a partir do molde scripts/social-image.html.
//
//   npm install --no-save sharp puppeteer-core
//   CHROME_PATH="C:/Program Files/Google/Chrome/Application/chrome.exe" node scripts/build-social-image.mjs
//
// Ao virar o ano: atualize o molde, o nome do arquivo abaixo e as meta tags og:image do index.html.
// O nome novo força WhatsApp e Facebook a buscarem a imagem de novo (eles guardam cache por URL).
import puppeteer from 'puppeteer-core';
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'assets', 'social', 'calendario-do-corre-2026.jpg');
const chromePath = process.env.CHROME_PATH;
if (!chromePath) {
  console.error('Defina CHROME_PATH com o caminho do Chrome ou do Edge.');
  process.exit(1);
}

const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 });
  await page.goto(pathToFileURL(path.join(root, 'scripts', 'social-image.html')).href, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);
  const png = await page.screenshot({ type: 'png' });

  await mkdir(path.dirname(output), { recursive: true });
  // JPEG é o único formato aceito por todas as redes (o WhatsApp não exibe AVIF); ideal abaixo de 300 KB.
  const info = await sharp(png).jpeg({ quality: 86, mozjpeg: true, chromaSubsampling: '4:4:4' }).toFile(output);
  console.log(`${path.relative(root, output)}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
} finally {
  await browser.close();
}
