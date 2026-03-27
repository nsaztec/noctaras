// Run this file (node generate_sitemap.cjs) to update sitemap.xml
const fs = require('fs');
const path = require('path');

const ROOT_DIR = 'C:\\\\Users\\\\enes.aydincakir\\\\Documents\\\\GitHub\\\\noctaras';
const BASE_URL = 'https://www.noctaras.com';

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

const getHtmlFiles = (dir, prefix = '') => {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory() && file === 'blog') {
            results = results.concat(getHtmlFiles(filePath, 'blog/'));
        } else if (file.endsWith('.html')) {
            results.push({
                loc: `${BASE_URL}/${prefix}${file === 'index.html' && prefix === '' ? '' : file}`,
                lastmod: formatDate(stat.mtime),
                priority: prefix === '' && file === 'index.html' ? '1.0' : (prefix === 'blog/' ? '0.8' : '0.9')
            });
        }
    });
    return results;
};

const urls = getHtmlFiles(ROOT_DIR);

const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\\n')}
</urlset>`;

fs.writeFileSync(path.join(ROOT_DIR, 'sitemap.xml'), sitemapContent);
fs.writeFileSync(path.join(ROOT_DIR, 'generate_sitemap.cjs'), '// Run this file (node generate_sitemap.cjs) to update sitemap.xml\n' + fs.readFileSync(__filename, 'utf8'));

console.log(`Generated sitemap.xml with ${urls.length} pages.`);
