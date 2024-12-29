import { ValidationSuite } from './validation-suite';
import type { ValidationSuiteResults } from './validation-suite';

async function runTests() {
    console.log('Starting Validation Suite...\n');
    
    const suite = new ValidationSuite();
    const results = await suite.runAllTests();
    
    // Track test categories
    const categories = new Map<string, { total: number; passed: number }>();
    results.results.forEach(result => {
        const category = result.testName.split(' - ')[0];
        const stats = categories.get(category) || { total: 0, passed: 0 };
        stats.total++;
        if (result.passed) stats.passed++;
        categories.set(category, stats);
    });

    // Print summary
    console.log('\nValidation Suite Results:');
    console.log('------------------------');
    console.log(`Total Tests: ${results.totalTests}`);
    console.log(`Passed: \x1b[32m${results.passedTests}\x1b[0m`);
    console.log(`Failed: \x1b[31m${results.failedTests}\x1b[0m`);
    
    // Calculate pass rate with division by zero protection
    const passRate = results.totalTests > 0 
        ? ((results.passedTests / results.totalTests) * 100).toFixed(1)
        : '0.0';
    console.log(`Pass Rate: ${passRate}%\n`);
    
    // Print category summary
    console.log('Category Summary:');
    console.log('----------------');
    categories.forEach((stats, category) => {
        const categoryPassRate = ((stats.passed / stats.total) * 100).toFixed(1);
        console.log(`${category}: ${stats.passed}/${stats.total} (${categoryPassRate}%)`);
    });
    console.log('');

    // Print detailed results
    console.log('Detailed Results:');
    console.log('----------------');
    results.results.forEach(result => {
        const status = result.passed 
            ? '\x1b[32m✅ PASS\x1b[0m' 
            : '\x1b[31m❌ FAIL\x1b[0m';
        console.log(`${status} | ${result.testName}`);
        
        if (!result.passed) {
            if (result.error) {
                console.log(`  \x1b[31mError: ${result.error}\x1b[0m`);
            } else if (result.metrics) {
                const diffPercent = (result.metrics.difference * 100).toFixed(1);
                console.log(`  Max Difference: ${diffPercent}%`);
                console.log(`  Expected: ${JSON.stringify(result.metrics.expected, null, 2)}`);
                console.log(`  Actual: ${JSON.stringify(result.metrics.actual, null, 2)}`);
            }
        }
        console.log('');
    });
    
    // Exit with appropriate code
    process.exit(results.failedTests > 0 ? 1 : 0);
}

runTests().catch(error => {
    console.error('\x1b[31mTest suite failed:\x1b[0m', error);
    process.exit(1);
});
