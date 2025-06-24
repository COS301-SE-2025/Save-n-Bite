module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/components/auth/FoodCard.jsx',
    'src/components/auth/CustomerNavBar.jsx',
    'src/components/auth/FilterSidebar.jsx'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  testMatch: [
    '<rootDir>/src/**/unitTests/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  moduleDirectories: ['node_modules', 'src'],
  testTimeout: 10000,
  collectCoverage: false,
  clearMocks: true,
  restoreMocks: true
};
