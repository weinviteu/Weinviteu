const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/studio.css');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all blocks starting with .header
content = content.replace(/^[ \t]*\.header[^\{]*\{[\s\S]*?\}/gm, '');

fs.writeFileSync(filePath, content);
console.log('Removed all .header overrides from studio.css');
