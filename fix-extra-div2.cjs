const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /<\/div>\s*<\/main>/;
content = content.replace(regex, "</main>");
fs.writeFileSync('src/App.tsx', content);
