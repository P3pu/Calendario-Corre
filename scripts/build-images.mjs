// Gera as variantes responsivas (AVIF + WebP) usadas pela LP em assets/.
//
// As fontes em alta resolução não ficam versionadas na árvore atual para manter o
// repositório leve; elas estão preservadas na tag `baseline-p1`. Para regerar:
//
//   git archive --format=zip -o fontes.zip baseline-p1 assets
//   (extraia fontes.zip em uma pasta fora do repositório)
//   npm install --no-save sharp
//   node scripts/build-images.mjs <pasta-extraida>/assets [banner|locais]
//
// O último argumento é opcional e limita a geração ao banner ou às fotos dos locais.
// Para um local novo, adicione a fonte (PNG 1560x680) em LOCATIONS abaixo.
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [sourceDir, only] = process.argv.slice(2);
if (!sourceDir || (only && !['banner', 'locais'].includes(only))) {
  console.error('Uso: node scripts/build-images.mjs <pasta-com-as-fontes> [banner|locais]');
  process.exit(1);
}
const outDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'assets');

// Fotos dos locais (sem texto): AVIF q52 ficou visualmente equivalente ao WebP anterior com ~40% menos bytes.
// WebP é só fallback (navegadores sem AVIF); q75 mantém o peso que ele já tinha.
const PHOTO_FORMATS = {
  avif: (image) => image.avif({ quality: 52, effort: 6 }),
  webp: (image) => image.webp({ quality: 75, effort: 6 })
};

// Banner: tem texto verde saturado sobre foto. Com q52 e subamostragem de cor 4:2:0 as bordas das
// letras e o fundo ficavam pastosos; q80 sem subamostragem (4:4:4) fica praticamente igual à fonte.
const BANNER_FORMATS = {
  avif: (image) => image.avif({ quality: 80, effort: 6, chromaSubsampling: '4:4:4' }),
  webp: (image) => image.webp({ quality: 85, effort: 6, smartSubsample: true })
};

// Recorte central 3:2 para os cards comuns, que têm proporção próxima de 1:1.
const CARD_CROP_RATIO = 3 / 2;

const BANNER = { source: 'banner-calendario-corre-original-hd.webp', name: 'banner-calendario-corre', widths: [800, 1200, 1800, 2360] };

const LOCATIONS = ['centro-olimpico', 'ibirapuera', 'pacaembu', 'parque-do-povo', 'parque-independencia', 'parque-villa-lobos', 'praca-herois-feb']
  .map((name) => ({ source: `${name}-hd.png`, name }));
const FULL_WIDTHS = [800, 1200, 1560];
const CARD_WIDTHS = [520, 780, 1020];

async function writeVariants(input, name, widths, formats) {
  for (const width of widths) {
    for (const [format, encode] of Object.entries(formats)) {
      const file = path.join(outDir, `${name}-${width}.${format}`);
      const info = await encode(sharp(input).resize({ width, withoutEnlargement: true })).toFile(file);
      console.log(`${path.basename(file).padEnd(40)} ${info.width}x${info.height}  ${(info.size / 1024).toFixed(1)} KB`);
    }
  }
}

if (only !== 'locais') {
  await writeVariants(path.join(sourceDir, BANNER.source), BANNER.name, BANNER.widths, BANNER_FORMATS);
}

if (only !== 'banner') {
  for (const location of LOCATIONS) {
    const source = path.join(sourceDir, location.source);
    await writeVariants(source, location.name, FULL_WIDTHS, PHOTO_FORMATS);

    const { width, height } = await sharp(source).metadata();
    const cropWidth = Math.min(width, Math.round(height * CARD_CROP_RATIO));
    const crop = await sharp(source)
      .extract({ left: Math.round((width - cropWidth) / 2), top: 0, width: cropWidth, height })
      .png()
      .toBuffer();
    await writeVariants(crop, `${location.name}-card`, CARD_WIDTHS, PHOTO_FORMATS);
  }
}
