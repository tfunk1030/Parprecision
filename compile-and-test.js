const { execSync } = require('child_process');

// Compile TypeScript files
console.log('Compiling TypeScript files...');
execSync('npx tsc src/core/hybrid-shot-model.ts --outDir dist --module commonjs --esModuleInterop', { stdio: 'inherit' });
execSync('npx tsc src/core/legacy/simplified-shot-model.ts --outDir dist --module commonjs --esModuleInterop', { stdio: 'inherit' });

// Update test script imports
const testScript = require('./test-model-comparison.js');

console.log('\nRunning comparison test...');