/**
 * PWA 아이콘 생성 스크립트
 * 실행: node scripts/generate-icons.mjs
 */
import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');
const iconsDir = join(projectRoot, 'public', 'icons');

mkdirSync(iconsDir, { recursive: true });

// 투자 매니저 아이콘 SVG (파란 배경 + 하얀 차트 라인)
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- 배경 -->
  <rect width="512" height="512" rx="80" fill="#1d4ed8"/>

  <!-- 상승 차트 라인 -->
  <polyline
    points="60,370 150,280 230,310 320,200 420,140"
    fill="none"
    stroke="white"
    stroke-width="28"
    stroke-linecap="round"
    stroke-linejoin="round"
  />

  <!-- 차트 점들 -->
  <circle cx="60" cy="370" r="16" fill="white"/>
  <circle cx="150" cy="280" r="16" fill="white"/>
  <circle cx="230" cy="310" r="16" fill="white"/>
  <circle cx="320" cy="200" r="16" fill="white"/>
  <circle cx="420" cy="140" r="16" fill="white"/>

  <!-- 하단 수평선 -->
  <line x1="45" y1="410" x2="467" y2="410" stroke="rgba(255,255,255,0.4)" stroke-width="6" stroke-linecap="round"/>

  <!-- 화살표 (우상향) -->
  <polyline
    points="390,110 420,140 450,110"
    fill="none"
    stroke="white"
    stroke-width="22"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>`;

const svgBuffer = Buffer.from(svgIcon);

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  const outputPath = join(iconsDir, name);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outputPath);
  console.log(`✅ Generated: public/icons/${name} (${size}x${size})`);
}

console.log('\n🎉 All icons generated successfully!');
