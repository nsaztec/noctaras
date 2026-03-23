import fs from 'fs';
import path from 'path';

const dirs = ['C:\\Users\\enes.aydincakir\\Documents\\GitHub\\noctaras', 'C:\\Users\\enes.aydincakir\\Documents\\GitHub\\noctaras\\blog'];

const CSS = `
<style>
  /* Global Mobile Scroll Fix */
  html, body {
    max-width: 100vw !important;
    overflow-x: clip !important;
  }
</style>
`;

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
  files.forEach(file => {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    if (!content.includes('Global Mobile Scroll Fix')) {
      content = content.replace('</head>', CSS + '</head>');
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Fixed:', filePath);
    }
  });
});
console.log('Scroll fixed globally.');
