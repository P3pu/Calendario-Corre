// Gera favicon.ico (16, 32 e 48 px) e apple-touch-icon.png (180 px) a partir de favicon.svg.
//
//   npm install --no-save sharp puppeteer-core
//   node scripts/build-icons.mjs
import sharp from 'sharp';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const svg = await readFile(path.join(root, 'favicon.svg'));

// Densidade alta rasteriza o SVG em alta resolução antes de reduzir, evitando ícones borrados.
const renderPng = (size, background) => {
  const image = sharp(svg, { density: 1200 }).resize(size, size);
  return (background ? image.flatten({ background }) : image).png().toBuffer();
};

// ICO com PNGs embutidos (aceito por todos os navegadores atuais e pelo Windows).
function createIco(images) {
  const header = Buffer.alloc(6 + 16 * images.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, index) => {
    const entry = 6 + 16 * index;
    header.writeUInt8(size >= 256 ? 0 : size, entry);
    header.writeUInt8(size >= 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const icoSizes = [16, 32, 48];
const icoImages = await Promise.all(icoSizes.map(async (size) => ({ size, data: await renderPng(size) })));
await writeFile(path.join(root, 'favicon.ico'), createIco(icoImages));

// iOS aplica o próprio arredondamento e não aceita transparência: fundo sólido na cor da marca.
await writeFile(path.join(root, 'apple-touch-icon.png'), await renderPng(180, '#101d26'));

console.log('favicon.ico (16/32/48) e apple-touch-icon.png (180) gerados.');
