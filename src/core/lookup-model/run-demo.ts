import { runDemo } from './demo';

console.log('Starting demo...\n');

try {
    runDemo();
    console.log('\nDemo completed successfully.');
} catch (error: unknown) {
    console.error('Error running demo:', error);
    process.exit(1);
}