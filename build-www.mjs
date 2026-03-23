import { cpSync, mkdirSync, existsSync, rmSync } from 'fs';

const assets = [
  'index.html', 'app.html', 'about.html', 'contact.html',
  'privacy.html', 'terms.html', 'success.html',
  'favicon.png', 'favicon.svg', 'logo.js', 'theme.js',
  'manifest.json', 'blog', 'api'
];

// Add tree-leaves.mp4 only if it exists (large file)
assets.push('tree-leaves.mp4');

if (existsSync('www')) rmSync('www', { recursive: true });
mkdirSync('www');

for (const asset of assets) {
  try {
    cpSync(asset, `www/${asset}`, { recursive: true });
    console.log(`✓ ${asset}`);
  } catch {
    console.warn(`  skipped: ${asset}`);
  }
}
console.log('\nwww/ ready.');
