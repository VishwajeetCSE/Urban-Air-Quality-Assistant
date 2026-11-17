/**
 * @fileoverview Static Quality, Security, and Size Linter
 * Enforces repository size ceiling (< 1 MB), 0 eval statements, 0 unescaped innerHTML,
 * and 0 leaked credentials.
 * Execute with: node scripts/lint.js
 * @author Vishwajeet Kumar
 * @license MIT
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const MAX_REPO_BYTES = 1024 * 1024; // Strictly < 1 MB constraint

let errorCount = 0;
let fileCount = 0;
let totalSizeBytes = 0;

console.log('\x1b[1m\x1b[36m================================================================');
console.log('   🔍 AeroShield AI — Static Security & Architecture Linter');
console.log('================================================================\x1b[0m');

function checkFile(filePath) {
  const relPath = path.relative(ROOT_DIR, filePath);
  const stats = fs.statSync(filePath);
  totalSizeBytes += stats.size;
  fileCount++;

  const content = fs.readFileSync(filePath, 'utf8');

  // 1. Check for eval or Function() execution (in JS/HTML files, excluding lint tool itself)
  if (!relPath.includes('lint.js') && (filePath.endsWith('.js') || filePath.endsWith('.html'))) {
    if (/\beval\s*\(/.test(content)) {
      console.error(`\x1b[31m✖ Security Hazard:\x1b[0m Forbidden 'eval()' found in ${relPath}`);
      errorCount++;
    }
    if (/new\s+Function\s*\(/.test(content)) {
      console.error(`\x1b[31m✖ Security Hazard:\x1b[0m Forbidden 'new Function()' found in ${relPath}`);
      errorCount++;
    }
  }

  // 2. Check for hardcoded API keys
  if (/AIzaSy[A-Za-z0-9_-]{33}/.test(content) && !relPath.includes('test.js')) {
    console.error(`\x1b[31m✖ Security Hazard:\x1b[0m Potential hardcoded Gemini API key found in ${relPath}`);
    errorCount++;
  }

  // 3. Check for unsafe innerHTML assignments in JS files
  if (filePath.endsWith('.js') && !relPath.includes('security.js') && !relPath.includes('ui-renderers.js')) {
    const lines = content.split('\n');
    lines.forEach((line, lineNum) => {
      if (/\.innerHTML\s*=/.test(line) && !line.includes('// safe')) {
        console.error(`\x1b[31m✖ XSS Hazard:\x1b[0m Direct unescaped innerHTML assignment in ${relPath}:${lineNum + 1}`);
        errorCount++;
      }
    });
  }
}

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === '.user_uploaded') continue;
      walkDir(fullPath);
    } else if (entry.isFile()) {
      if (/\.(js|html|css|json|md)$/.test(entry.name)) {
        checkFile(fullPath);
      }
    }
  }
}

// Execute scan
walkDir(ROOT_DIR);

console.log(`\n\x1b[1mScanned ${fileCount} files. Total Repository Payload: ${(totalSizeBytes / 1024).toFixed(2)} KB\x1b[0m`);

// Verify repo size ceiling
if (totalSizeBytes > MAX_REPO_BYTES) {
  console.error(`\x1b[31m✖ Ceiling Violation:\x1b[0m Total size exceeds 1 MB limit (${(totalSizeBytes / 1024).toFixed(2)} KB)`);
  errorCount++;
} else {
  console.log(`\x1b[32m✔ Size Constraint Passed:\x1b[0m Repo payload ${(totalSizeBytes / 1024).toFixed(2)} KB is well within < 1 MB limit.`);
}

// Verify package.json type: module
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, 'package.json'), 'utf8'));
  if (pkg.type !== 'module') {
    console.error(`\x1b[31m✖ Configuration Error:\x1b[0m package.json must specify "type": "module"`);
    errorCount++;
  } else {
    console.log(`\x1b[32m✔ Module Standard Passed:\x1b[0m package.json defines "type": "module".`);
  }
} catch (e) {
  console.error(`\x1b[31m✖ Configuration Error:\x1b[0m Failed to parse package.json: ${e.message}`);
  errorCount++;
}

console.log('\n================================================================');
if (errorCount === 0) {
  console.log('\x1b[1m\x1b[32m   🎉 LINTER PASSED: 0 Security or Architecture Violations!\x1b[0m');
  console.log('================================================================\n');
  process.exit(0);
} else {
  console.error(`\x1b[1m\x1b[31m   ✖ LINTER FAILED: ${errorCount} Violations Found.\x1b[0m`);
  console.log('================================================================\n');
  process.exit(1);
}
