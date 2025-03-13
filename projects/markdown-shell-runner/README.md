# Markdown Shell Runner

A Visual Studio Code extension that allows you to run shell scripts directly from markdown code blocks.

## Features

- Run shell scripts from markdown code blocks with a simple run button or right-click
- Supports `shell`, `bash`, `sh`, and `zsh` code blocks
- View command output in a dedicated output channel
- Configurable supported languages

## Usage

### Using the Run Button

1. Open a markdown file in VS Code
2. Look for the "▶ Run" button that appears above shell code blocks:

   ![Run Button](images/run-button.png)

3. Click the run button to execute the code block
4. View the output in the "Markdown Shell Runner" output channel

### Using the Context Menu

1. Open a markdown file in VS Code
2. Place your cursor inside a shell code block like:

   ````markdown
   ```bash
   echo "Hello, World!"
   ls -la
   ```
   ````

3. Right-click and select "Run Shell Code Block" from the context menu
4. View the output in the "Markdown Shell Runner" output channel

## Extension Settings

This extension contributes the following settings:

* `markdownShellRunner.enabledLanguages`: Array of languages that can be executed from markdown code blocks (default: `["shell", "bash", "sh", "zsh"]`)
* `markdownShellRunner.enableCodeLens`: Enable or disable the run button above shell code blocks (default: `true`)

## Requirements

- Visual Studio Code 1.85.0 or higher

## Development

### Building the Extension

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm run compile` to compile the TypeScript code
4. Run `npm run package` to create a VSIX file

### Testing

The extension includes unit tests for the core functionality. To run the tests:

```bash
npm test
```

See the [test README](src/test/README.md) for more information about the tests.

## Known Issues

- Commands that require interactive input are not supported
- Long-running commands may timeout

## Release Notes

### 0.1.0

- Initial release
- Support for running shell code blocks
- Configurable language support
- Run button above shell code blocks

## Security Considerations

This extension executes shell commands on your system. Only run code that you trust and understand.

## License

MIT
