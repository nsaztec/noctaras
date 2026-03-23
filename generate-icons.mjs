// Run: node generate-icons.mjs
import sharp from 'sharp';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#07060F"/>
  <circle cx="208" cy="256" r="112" stroke="#9B8FE8" stroke-width="22" fill="none"/>
  <circle cx="304" cy="256" r="112" stroke="#C4B8FF" stroke-width="22" fill="none" opacity="0.65"/>
  <path d="M256 152C285 181 285 331 256 360C227 331 227 181 256 152Z" fill="#C4B8FF" opacity="0.4"/>
</svg>`;

const buf = Buffer.from(svgIcon);

await sharp(buf).resize(512, 512).png().toFile('icon-512.png');
await sharp(buf).resize(192, 192).png().toFile('favicon.png');
await sharp(buf).resize(180, 180).png().toFile('apple-touch-icon.png');

console.log('Icons generated: icon-512.png, favicon.png, apple-touch-icon.png');
