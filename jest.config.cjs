module.exports = {
  testEnvironment: "jsdom",

  collectCoverage: true,

  collectCoverageFrom: ["src/**/*.{js,jsx}"],

  coverageDirectory: "coverage",

  coverageReporters: ["text", "html"],

  coverageThreshold: {
    global: {
      branches: 15,
      functions: 15,
      lines: 15,
      statements: 15,
    },
  },
};
