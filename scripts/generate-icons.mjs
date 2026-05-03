import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const iconsDir = path.join(rootDir, 'public', 'icons');

async function generateIcons() {
  const sizes = [192, 512];
  
  for (const size of sizes) {
    const svg = `
      <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
        <rect width="${size}" height="${size}" fill="#d81e62" rx="${size * 0.166}"/>
        <text x="${size/2}" y="${size/2}" font-family="Arial" font-size="${size * 0.5}" fill="white" text-anchor="middle" dy=".35em">W</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svg))
      .png()
      .toFile(path.join(iconsDir, `icon-${size}.png`));
    
    console.log(`✓ Gerado icon-${size}.png`);
  }
  
  console.log('\n✅ Todos os ícones PWA gerados!');
}

generateIcons().catch(console.error);