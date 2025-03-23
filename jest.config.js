/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: 'node',
    verbose: true,
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    collectCoverage: true,
    coverageProvider: 'v8',
    collectCoverageFrom: ['src/**/*.ts', '!tests/**', '!**node_modules/**'],
};
