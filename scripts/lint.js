/**
 * @fileoverview Deterministic Static Security, Code Quality & Repository Size Linter
 * Enforces repository size ceiling (< 1 MB), 0 eval statements, 0 unescaped innerHTML,
 * and strict modular architecture.
 * Execute with: node scripts/lint.js
 * @author Vishwajeet Kumar (VishwajeetCSE)
 * @license MIT
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const MAX_REPO_SIZE_BYTES = 1024 * 1024; // 1 MB strict ceiling

let violationCount = 0;

console.log('\x1b[1m\x1b[36m================================================================');
console.log('   🔍 VayuGuardian AI — Static Security & Architecture Linter');
console.log('================================================================\x1b[0m\n');

function getFilesRecursively(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    if (file === '.git' || file === 'node_modules') return;
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else {
      results.push(fullPath);
    }
  });
  return results;
}

const allFiles = getFilesRecursively(ROOT_DIR);

// 1. Check Total Repository Size
let totalSizeBytes = 0;
allFiles.forEach(f => {
  totalSizeBytes += fs.statSync(f).size;
});

const totalSizeKB = Math.round(totalSizeBytes / 1024);
console.log(`📦 Total Repository Size: \x1b[32m${totalSizeKB} KB\x1b[0m (Ceiling: 1024 KB)`);

if (totalSizeBytes > MAX_REPO_SIZE_BYTES) {
  console.error(`\x1b[31m✖ Violation:\x1b[0m Repository size exceeds 1 MB ceiling! (${totalSizeKB} KB)`);
  violationCount++;
}

// 2. Scan for Security Hazards (eval, new Function) and Unescaped innerHTML in JS/HTML
allFiles.forEach(file => {
  const relPath = path.relative(ROOT_DIR, file).replace(/\\/g, '/');
  if (relPath === 'scripts/lint.js') return; // Skip linter's own regex declarations
  const ext = path.extname(file).toLowerCase();

  if (ext === '.js' || ext === '.html') {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, lineNum) => {
      // 2a. Check for eval()
      if (/\beval\s*\(/.test(line)) {
        console.error(`\x1b[31m✖ Security Hazard:\x1b[0m Forbidden eval() detected in ${relPath}:${lineNum + 1}`);
        violationCount++;
      }

      // 2b. Check for new Function()
      if (/new\s+Function\s*\(/.test(line)) {
        console.error(`\x1b[31m✖ Security Hazard:\x1b[0m Forbidden new Function() in ${relPath}:${lineNum + 1}`);
        violationCount++;
      }

      // 2c. Check for unescaped innerHTML in JS files
      if (ext === '.js' && /\.innerHTML\s*=/.test(line) && !line.includes('// safe')) {
        console.error(`\x1b[31m✖ XSS Hazard:\x1b[0m Direct unescaped innerHTML assignment in ${relPath}:${lineNum + 1}`);
        violationCount++;
      }
    });
  }
});

// 3. Verify Required Production Files Exist
const requiredFiles = [
  'package.json',
  'vercel.json',
  'index.html',
  'styles.css',
  'app.js',
  'test.js',
  'README.md',
  'TESTING.md',
  'src/constants.js',
  'src/security.js',
  'src/aqi-calculator.js',
  'src/routine-engine.js',
  'src/hacks-engine.js',
  'src/ai.js',
  'src/storage.js',
  'src/ui-accessibility.js',
  'src/ui-renderers.js',
  'src/ui-events.js',
  'src/index.js'
];

requiredFiles.forEach(req => {
  const full = path.join(ROOT_DIR, req);
  if (!fs.existsSync(full)) {
    console.error(`\x1b[31m✖ Architectural Violation:\x1b[0m Missing required file: ${req}`);
    violationCount++;
  }
});

if (violationCount === 0) {
  console.log('\n\x1b[1m\x1b[32m🎉 LINTER PASSED: 0 Security or Architecture Violations!\x1b[0m\n');
  process.exit(0);
} else {
  console.error(`\n\x1b[1m\x1b[31m✖ Linter failed with ${violationCount} violation(s).\x1b[0m\n`);
  process.exit(1);
}
