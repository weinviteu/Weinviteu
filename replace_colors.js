const fs = require('fs');
const path = require('path');

const colorMap = {
  // cta-section
  '#1c4036': 'var(--paper)',
  '#faf5e8': 'var(--ink)',
  '#b6a579': 'var(--gold)',
  '#c6ccb1': 'var(--gold)',
  '#bbcab7': 'var(--muted)',
  // footer
  '#eceee2': 'var(--paper)',
  '#d9dfce': 'var(--line)',
  '#3d5140': 'var(--muted)',
  '#304d40': 'var(--paper)',
  '#f1edce': 'var(--ink)',
  '#d8e8a7': 'var(--gold)',
  // theme-forest
  '#234839': 'var(--paper)',
  '#67806a': 'var(--line)',
  // art backgrounds
  '#e4e5d9': 'var(--paper)',
  '#c5cec0': 'var(--paper)',
  '#efdfdb': 'var(--paper)',
  '#d7d7dd': 'var(--paper)',
  // other badges/borders
  '#4f5c47': 'var(--ink)',
  '#cdd3c2': 'var(--line)',
  '#d8dcce': 'var(--line)',
  '#d8ddcf': 'var(--line)',
  '#9b9d7d': 'var(--gold)',
  '#879171': 'var(--gold)',
  // global misc
  '#e5e8d9': 'var(--paper)',
  '#a78d53': 'var(--gold)',
  '#808577': 'var(--muted)',
  '#69755b': 'var(--muted)',
  '#f0f1e8': 'var(--paper)',
};

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.css') || fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;
      
      for (const [oldColor, newColor] of Object.entries(colorMap)) {
        const regex = new RegExp(oldColor, 'gi');
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

processDirectory(path.join(__dirname, 'src'));
console.log('Color replacement complete.');
