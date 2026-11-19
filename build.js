// Inlines css, scripts and fonts from index.src.html into a single self-contained index.html.
const fs = require('fs');
const path = require('path');

const root = __dirname;
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let css = read('css/style.css').replace(/url\("\.\.\/(fonts\/[^"]+)"\)/g, (_, file) =>
  'url("data:font/woff2;base64,' + fs.readFileSync(path.join(root, file)).toString('base64') + '")');

let html = read('index.src.html')
  .replace(/^\s*<link rel="preload"[^>]*>\n/m, '')
  .replace(/<link rel="stylesheet" href="([^"]+)">/, () => '<style>\n' + css + '</style>')
  .replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
    // a literal closing tag inside the code would end the inline script early
    '<script>\n' + read(src).replace(/<\/script/gi, '<\\/script') + '\n</script>');

fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html', (html.length / 1024).toFixed(0) + ' KB');
