const fs = require('fs');
const files = fs.readdirSync('public/templates').filter(f => f.endsWith('.html'));

files.forEach(f => {
  const content = fs.readFileSync('public/templates/' + f, 'utf8');
  const match = content.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (match) {
    console.log(f, 'has image, length:', match[1].length, match[1].substring(0, 30));
  } else {
    console.log(f, 'no image found');
  }
});
