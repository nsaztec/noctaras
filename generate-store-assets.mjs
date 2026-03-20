import sharp from 'sharp';

// ── Helpers ──────────────────────────────────────────────────────────────────

function svgToPng(svgStr, width, height, outputPath) {
  return sharp(Buffer.from(svgStr))
    .resize(width, height)
    .png()
    .toFile(outputPath);
}

// ── Store Logo 52×52 ─────────────────────────────────────────────────────────

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 52 52">
  <rect width="52" height="52" rx="13" fill="#07060F"/>
  <circle cx="21" cy="26" r="11" stroke="#9B8FE8" stroke-width="1.6" fill="none"/>
  <circle cx="31" cy="26" r="11" stroke="#C4B8FF" stroke-width="1.6" fill="none" opacity="0.6"/>
  <path d="M26 15.5C28.4 17.9 28.4 34.1 26 36.5C23.6 34.1 23.6 17.9 26 15.5Z" fill="#C4B8FF" opacity="0.35"/>
</svg>`;

// ── Product Image 800×450 ─────────────────────────────────────────────────────

const productSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
  <defs>
    <radialGradient id="glow" cx="50%" cy="40%" r="55%">
      <stop offset="0%" stop-color="#6B5CE7" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#07060F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="800" height="450" rx="16" fill="#07060F"/>
  <rect width="800" height="450" rx="16" fill="url(#glow)"/>

  <!-- Moon icon -->
  <circle cx="400" cy="148" r="28" stroke="#9B8FE8" stroke-width="1.8" fill="none"/>
  <circle cx="416" cy="148" r="28" stroke="#C4B8FF" stroke-width="1.8" fill="none" opacity="0.55"/>
  <path d="M408 121C411.5 124.5 411.5 171.5 408 175C404.5 171.5 404.5 124.5 408 121Z" fill="#C4B8FF" opacity="0.32"/>

  <!-- NOCTARAS label -->
  <text x="400" y="222" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="500" letter-spacing="10" fill="rgba(255,255,255,0.28)" text-decoration="none">NOCTARAS PRO</text>

  <!-- Main title -->
  <text x="400" y="288" text-anchor="middle" font-family="Georgia, serif" font-size="58" font-weight="400" font-style="italic" fill="#EDE8FF" letter-spacing="-1">Dream Journal</text>

  <!-- Divider -->
  <rect x="384" y="308" width="32" height="1" fill="rgba(255,255,255,0.15)"/>

  <!-- Tagline -->
  <text x="400" y="340" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="13" fill="rgba(255,255,255,0.3)" letter-spacing="4">INTERPRET · RECORD · UNDERSTAND</text>
</svg>`;

// ── Store Banner 1920×400 ─────────────────────────────────────────────────────

const bannerSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="400" viewBox="0 0 1920 400">
  <defs>
    <radialGradient id="glowL" cx="20%" cy="50%" r="40%">
      <stop offset="0%" stop-color="#7060DD" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="#07060F" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowR" cx="80%" cy="50%" r="40%">
      <stop offset="0%" stop-color="#B8ADFF" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#07060F" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1920" height="400" fill="#07060F"/>
  <rect width="1920" height="400" fill="url(#glowL)"/>
  <rect width="1920" height="400" fill="url(#glowR)"/>

  <!-- Moon icon -->
  <circle cx="960" cy="134" r="24" stroke="#9B8FE8" stroke-width="1.5" fill="none"/>
  <circle cx="974" cy="134" r="24" stroke="#C4B8FF" stroke-width="1.5" fill="none" opacity="0.55"/>
  <path d="M967 111C970 114 970 154 967 157C964 154 964 114 967 111Z" fill="#C4B8FF" opacity="0.32"/>

  <!-- Brand label -->
  <text x="960" y="192" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="500" letter-spacing="10" fill="rgba(255,255,255,0.28)">NOCTARAS</text>

  <!-- Main title -->
  <text x="960" y="272" text-anchor="middle" font-family="Georgia, serif" font-size="82" font-weight="400" font-style="italic" fill="#EDE8FF" letter-spacing="-2">Dream Journal &amp; Interpreter</text>

  <!-- Tagline -->
  <text x="960" y="322" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="rgba(255,255,255,0.28)" letter-spacing="5">UNDERSTAND YOUR DREAMS · TRACK PATTERNS · GROW</text>
</svg>`;

// ── Generate ──────────────────────────────────────────────────────────────────

async function run() {
  await svgToPng(logoSvg, 52, 52, 'store-logo.png');
  console.log('✓ store-logo.png');

  await svgToPng(productSvg, 800, 450, 'product-image.png');
  console.log('✓ product-image.png');

  await svgToPng(bannerSvg, 1920, 400, 'store-banner.png');
  console.log('✓ store-banner.png');
}

run().catch(console.error);
