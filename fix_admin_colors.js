const fs = require('fs');
const path = require('path');

const colorMap = {
  '"#666"': '"var(--muted)"',
  '"#888"': '"var(--muted)"',
  '"#444"': '"var(--muted)"',
  '"#333"': '"var(--ink)"',
  '"#111"': '"var(--ink)"',
  '"#1a1a1a"': '"var(--ink)"',
  '"#fafafa"': '"rgba(255, 255, 255, 0.05)"',
  '"#eee"': '"var(--line)"',
  '"#f0f0f0"': '"rgba(255, 255, 255, 0.05)"',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        const regex = new RegExp(oldColor, 'g');
        if (regex.test(content)) {
          content = content.replace(regex, newColor);
          changed = true;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
        console.log(`Updated colors in ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src/app/admin'));
console.log('Admin color replacement complete.');
