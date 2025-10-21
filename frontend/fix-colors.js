const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Pattern replacements to apply
const replacements = [
  // Background colors
  { from: /className="(.*?)bg-gray-50(.*?)"/g, to: 'className="$1bg-surface-tertiary dark:bg-slate-700/30$2"' },
  { from: /className="(.*?)bg-gray-100(.*?)"/g, to: 'className="$1bg-surface-secondary dark:bg-slate-800$2"' },

  // Text colors - using CSS variables
  { from: /className="(.*?)text-gray-600(?!\s*dark:)(.*?)"/g, to: 'className="$1text-text-secondary dark:text-slate-300$2"' },
  { from: /className="(.*?)text-gray-700(?!\s*dark:)(.*?)"/g, to: 'className="$1text-text-primary dark:text-slate-200$2"' },
  { from: /className="(.*?)text-gray-900(?!\s*dark:)(.*?)"/g, to: 'className="$1text-text-primary dark:text-slate-100$2"' },
  { from: /className="(.*?)text-gray-500(?!\s*dark:)(.*?)"/g, to: 'className="$1text-text-tertiary dark:text-slate-400$2"' },
];

// Find all JSX files
const files = glob.sync('src/components/**/*.jsx');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  }
});

console.log('Done!');
