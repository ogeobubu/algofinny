import fs from 'fs/promises';
import path from 'path';

// Fix all TypeScript import statements to include .js extension
async function fixImports() {
  const srcDir = './src';
  
  async function processDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.name.endsWith('.ts')) {
        await fixImportsInFile(fullPath);
      }
    }
  }
  
  async function fixImportsInFile(filePath) {
    try {
      let content = await fs.readFile(filePath, 'utf8');
      let modified = false;
      
      // Fix relative imports that don't have .js extension
      content = content.replace(
        /import\s+(.+?)\s+from\s+['"](\.{1,2}\/[^'"]+?)['"](?!\.(js|ts|json))/g,
        (match, importClause, importPath) => {
          // Don't modify if it already has an extension or is not a relative path
          if (importPath.includes('.') && !importPath.endsWith('/')) {
            return match;
          }
          modified = true;
          return `import ${importClause} from "${importPath}.js"`;
        }
      );
      
      // Fix export from statements
      content = content.replace(
        /export\s+(.+?)\s+from\s+['"](\.{1,2}\/[^'"]+?)['"](?!\.(js|ts|json))/g,
        (match, exportClause, importPath) => {
          if (importPath.includes('.') && !importPath.endsWith('/')) {
            return match;
          }
          modified = true;
          return `export ${exportClause} from "${importPath}.js"`;
        }
      );
      
      if (modified) {
        await fs.writeFile(filePath, content, 'utf8');
        console.log(`✅ Fixed imports in: ${filePath}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  await processDirectory(srcDir);
  console.log('🎉 Import fixing complete!');
}

fixImports().catch(console.error);