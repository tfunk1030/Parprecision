// Simple script to run validation tests

console.log('Starting validation tests...');

// Run npm install first if you haven't already
const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';

require('child_process').spawn(command, ['run', 'test'], {
    stdio: 'inherit',
    shell: true
}).on('exit', (code) => {
    if (code === 0) {
        console.log('\nValidation tests completed successfully!');
        console.log('\nTo run specific validation scenarios:');
        console.log('\n1. Basic flight validation:');
        console.log('   npm test -- -t "Flight Integration Performance"');
        
        console.log('\n2. Memory management tests:');
        console.log('   npm test -- -t "Memory Management"');
        
        console.log('\n3. Cache performance tests:');
        console.log('   npm test -- -t "Cache Performance"');
        
        console.log('\n4. Parallel processing tests:');
        console.log('   npm test -- -t "Parallel Processing Performance"');
        
        console.log('\n5. Run all performance tests:');
        console.log('   npm test -- performance.test.ts');
        
        console.log('\nFor real-time validation with data collection:');
        console.log('   npx ts-node src/tools/run-validation.ts');
    } else {
        console.error('\nValidation tests failed with code:', code);
    }
});