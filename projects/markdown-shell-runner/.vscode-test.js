const { defineConfig } = require('@vscode/test-cli');
const path = require('path');

module.exports = defineConfig({
  files: 'out/test/**/*.test.js',
  version: 'stable',
  extensionDevelopmentPath: path.resolve(__dirname),
  mocha: {
    ui: 'tdd',
    timeout: 20000
  }
}); 