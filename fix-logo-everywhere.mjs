import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSS_INJECT = `
<style>
/* Universal Standardized Logo Styles based on NoctarasBlog */
.logo, .f-logo, .auth-logo, .nav-logo, .j-logo {
  font-family: var(--sans, 'Inter', sans-serif) !important; 
  font-size: 1.2rem !important; 
  font-weight: 600 !important; 
  display: flex !important; 
  align-items: center !important; 
  justify-content: flex-start !important;
  gap: 10px !important; 
  color: var(--text) !important;
  text-decoration: none !important;
  letter-spacing: normal !important;
  margin-bottom: 0 !important; /* clear overrides */
}
.logo:hover, .f-logo:hover, .auth-logo:hover, .nav-logo:hover, .j-logo:hover {
  opacity: 1 !important;
}
.logo svg, .f-logo svg, .auth-logo svg, .nav-logo svg, .j-logo svg {
  width: 24px !important;
  height: 24px !important;
  min-width: 24px !important;
  transition: transform 0.5s cubic-bezier(0.34,1.56,0.64,1) !important;
}
.logo:hover svg, .f-logo:hover svg, .auth-logo:hover svg, .nav-logo:hover svg, .j-logo:hover svg {
  transform: rotate(180deg) scale(1.1) !important;
}
.auth-logo span, .nav-logo-text, .nav-logo span, .j-logo span, .f-logo {
  font-size: 1.2rem !important;
}
</style>
`;

const TARGET_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>`;

const htmlSVGRegex = /<svg[^>]*>[\s\S]*?M12 6\.2C13\.6[\s\S]*?<\/svg>/g;
const oldColorlessRegex = /<svg[^>]*>[\s\S]*?stroke="currentColor"[\s\S]*?<\/svg>/g;
// Specifically looking for our logo geometry just to be safe. We know it has double circles.
// Actually, I'll match anything containing circle cx="9" cy="12" and cx="15" cy="12"
const geometricLogoRegex = /<svg[^>]*>[\s\S]*?circle cx="9" cy="12"[\s\S]*?circle cx="15" cy="12"[\s\S]*?<\/svg>/g;

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) {
      if (f === 'blog') processDir(p);
    } else if (f.endsWith('.html')) {
      let content = fs.readFileSync(p, 'utf8');
      
      // Inject CSS once
      if (!content.includes('Universal Standardized Logo Styles')) {
        content = content.replace('</head>', CSS_INJECT + '\n</head>');
      }

      // Replace SVGs
      content = content.replace(geometricLogoRegex, TARGET_SVG);

      fs.writeFileSync(p, content, 'utf8');
      console.log('Fixed logo in', p);
    }
  }
}

processDir(__dirname);
