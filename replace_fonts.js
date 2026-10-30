const fs = require('fs');


const files = [
  'src/app/studio.css',
  'src/app/globals.css',
  'src/app/about/about.module.css',
  'src/app/contact/contact.module.css',
  'src/app/templates/templates.module.css'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace sans-serif
    content = content.replace(/font-family:\s*Arial,\s*Helvetica,\s*sans-serif;/g, 'font-family: var(--sans);');
    content = content.replace(/font-family:\s*Arial,\s*sans-serif;/g, 'font-family: var(--sans);');
    
    // Replace serif
    content = content.replace(/font-family:\s*Georgia,\s*serif;/g, 'font-family: var(--serif);');
    content = content.replace(/font-family:\s*Georgia,\s*"Times New Roman",\s*serif;/g, 'font-family: var(--serif);');
    content = content.replace(/font-family:\s*"Segoe UI",\s*"Helvetica Neue",\s*Arial,\s*sans-serif;/g, 'font-family: var(--sans);');
    
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
