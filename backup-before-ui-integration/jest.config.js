module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'jsdom',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest'
    },
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json'
        }
    },
    setupFiles: [
        'jest-canvas-mock',
        '<rootDir>/src/tests/setup.ts'
    ],
    moduleNameMapper: {
        '@tensorflow/tfjs-node-gpu': '<rootDir>/src/tests/mocks/tf-mock.ts',
        '@tensorflow/tfjs': '<rootDir>/src/tests/mocks/tf-mock.ts'
    },
    testEnvironmentOptions: {
        url: 'http://localhost/'
    },
    setupFilesAfterEnv: ['<rootDir>/src/tests/setup-after-env.ts'],
    testTimeout: 120000,
    watchPathIgnorePatterns: ['<rootDir>/src/tests/hardware-performance.test.ts'],
    testPathIgnorePatterns: process.env.NODE_ENV === 'watch' ? ['<rootDir>/src/tests/hardware-performance.test.ts'] : [],
    maxWorkers: process.env.CI ? 2 : '50%'
};
