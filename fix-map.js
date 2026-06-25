const fs = require('fs'); 
const path = require('path'); 
function walk(dir) { 
  let results = []; 
  const list = fs.readdirSync(dir); 
  list.forEach(function(file) { 
    file = dir + '/' + file; 
    const stat = fs.statSync(file); 
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file); 
    } 
  }); 
  return results; 
} 
const files = walk('d:/wiwokdetok-fullnex/src/app/api'); 
files.forEach(file => { 
  let content = fs.readFileSync(file, 'utf8'); 
  if (content.match(/\.map\(\s*([a-zA-Z0-9_]+)\s*=>/)) { 
    content = content.replace(/\.map\(\s*([a-zA-Z0-9_]+)\s*=>/g, '.map(($1: any) =>'); 
    fs.writeFileSync(file, content); 
    console.log('Replaced in ' + file); 
  } 
});
