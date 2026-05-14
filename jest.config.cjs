module.exports = {
  testEnvironment: 'jsdom',
  testMatch: ['**/__tests__/**/*.[jt]s?(x)'],
  moduleFileExtensions: ['js', 'jsx', 'json'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { configFile: './babel.config.json' }],
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.{js,jsx}', '!src/App.jsx', '!src/background.js', '!src/content.js', '!src/main.jsx'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  coverageReporters: ['text', 'lcov'],
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/tests/e2e/'],
};
