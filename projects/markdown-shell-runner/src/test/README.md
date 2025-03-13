# Markdown Shell Runner Tests

This directory contains tests for the Markdown Shell Runner extension.

## Test Structure

- `unit/`: Unit tests for the extension
  - `extension.test.ts`: Tests for the core functionality
  - `extension.mock.ts`: Mock implementation of the extension for testing
  - `vscode.mock.ts`: Mock implementation of the VS Code API for testing

## Running Tests

To run the tests, use the following command:

```bash
npm test
```

This command uses the `@vscode/test-cli` to run the tests in a VS Code environment. The test configuration is defined in the `.vscode-test.js` file in the root of the project.

## Test Configuration

The test configuration is defined in `.vscode-test.js` and includes:

- The test files to run
- The VS Code version to use
- The extension development path
- Mocha configuration options

## Test Coverage

The tests cover the following functionality:

- `extractCodeBlock`: Tests for extracting shell code blocks from markdown
  - Extracting bash code blocks
  - Extracting shell code blocks
  - Handling non-shell code blocks
  - Handling cursor positions outside code blocks

- `runShellCommand`: Tests for running shell commands (currently skipped)
  - These tests are skipped because we can't easily stub the `spawn` function in Node.js

## Adding New Tests

When adding new tests, follow these guidelines:

1. Use the mock implementations in `extension.mock.ts` and `vscode.mock.ts`
2. Add tests for new functionality in `extension.test.ts`
3. Run the tests to ensure they pass

## Debugging Tests

To debug tests, you can use the VS Code debugger with the "Extension Tests" launch configuration. This will run the tests in debug mode, allowing you to set breakpoints and step through the code.

## Troubleshooting

If you encounter issues with the tests:

1. Make sure the mock implementations match the actual implementations
2. Check that the test environment is properly set up
3. Verify that the tests are properly isolated from each other 