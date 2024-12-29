import { ModelValidator } from './model-validator';

/**
 * Run validation tests comparing enhanced model against advanced model
 */
async function runValidation() {
    console.log('Starting Enhanced Model Validation...');
    console.log('=====================================');

    try {
        const validator = new ModelValidator();
        await validator.runValidation();

        console.log('Validation complete!');
        console.log('Check validation-report.md for detailed results.');
    } catch (error) {
        console.error('Validation failed:', error);
        process.exit(1);
    }
}

// Run validation if called directly
if (require.main === module) {
    runValidation().catch(console.error);
}

export { runValidation };