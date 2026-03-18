import fs from 'fs';
import path from 'path';

const file = 'C:\\Users\\enes.aydincakir\\Documents\\GitHub\\noctaras\\app.html';

const CSS_INJECT = `
<style>
/* NoctarasBlog Logo Consistency Override */
.logo, .f-logo, .auth-logo, .nav-logo, .j-logo {
  font-family: var(--sans, 'Inter', sans-serif) !important; 
  font-size: 1.2rem !important; 
  font-weight: 600 !important; 
  display: flex !important; 
  align-items: center !important; 
  gap: 10px !important; 
  color: var(--text) !important;
  text-decoration: none !important;
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
.auth-logo span, .j-logo span, .logo span {
  font-size: 1.2rem !important;
}
</style>
`;

const TARGET_SVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="9" cy="12" r="6.5" stroke="#5a7b6b" stroke-width="1.2" fill="none"/><circle cx="15" cy="12" r="6.5" stroke="#7a9b8b" stroke-width="1.2" fill="none" opacity="0.6"/><path d="M12 6.2C13.6 7.8 13.6 16.2 12 17.8C10.4 16.2 10.4 7.8 12 6.2Z" fill="#5a7b6b" opacity="0.28"/></svg>`;

// The previous version matches across multiple SVGs because [\s\S]*? is too permissive.
// We'll replace ANY SVG having stroke-width="2" and circle inside.
const oldLogoRegex = /<svg[^>]*>[\s\S]{0,300}circle cx="9"[^>]*?stroke-width="2"[A-Za-z0-9"'\s\-=\.\/]*>[\s\S]{0,300}circle cx="15"[^>]*?>[\s\S]{0,300}<\/svg>/g;
const secondaryRegex = /<svg[^>]*>[\s\S]{0,300}circle cx="9"[^>]*?stroke="currentColor"[\s\S]{0,300}circle cx="15"[^>]*?>[\s\S]{0,300}<\/svg>/g;

let content = fs.readFileSync(file, 'utf8');

// injecting css
if (!content.includes('NoctarasBlog Logo Consistency Override')) {
  content = content.replace('</head>', CSS_INJECT + '\n</head>');
}

// replacing svgs safely
content = content.replace(oldLogoRegex, TARGET_SVG);
content = content.replace(secondaryRegex, TARGET_SVG);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed app.html logs');
