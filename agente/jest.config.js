/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    // garante que dotenv não quebre os testes
  },
  setupFiles: ['<rootDir>/src/__tests__/setup.ts'],
  clearMocks: false,
  resetMocks: false,
}
