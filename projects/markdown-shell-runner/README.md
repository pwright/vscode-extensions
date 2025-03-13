# Markdown Shell Runner

A Visual Studio Code extension that allows you to run shell scripts directly from markdown code blocks.

## Features

- Run shell scripts from markdown code blocks with a simple run button or right-click
- Supports `shell`, `bash`, `sh`, and `zsh` code blocks
- Execute commands in dedicated terminals or view output in the output channel
- Each markdown file gets its own terminal for running commands
- Configurable supported languages
- Commands are executed from the directory of the markdown file

## Usage

### Using the Run Button

1. Open a markdown file in VS Code
2. Look for the "▶ Run" button that appears above shell code blocks:

   ![Run Button](images/run-button.png)

3. Click the run button to execute the code block
4. The command will run in a dedicated terminal named "Markdown Shell Runner (index)"

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
4. The command will run in a dedicated terminal

### Terminal Management

- Each markdown file gets its own dedicated terminal
- Terminals are named "Markdown Shell Runner (index)" where index starts from 0
- When you run commands from the same file, they will reuse the same terminal
- When you run commands from a different file, a new terminal will be created with an incremented index

## Extension Settings

This extension contributes the following settings:

* `markdownShellRunner.enabledLanguages`: Array of languages that can be executed from markdown code blocks (default: `["shell", "bash", "sh", "zsh"]`)
* `markdownShellRunner.enableCodeLens`: Enable or disable the run button above shell code blocks (default: `true`)
* `markdownShellRunner.useTerminal`: Run shell commands in a terminal instead of the output channel (default: `true`)

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

### 0.3.1

- Fixed issue with exclamation marks in shell commands causing quote mismatching
- Improved terminal handling to properly escape special characters
- Added support for disabling history expansion in bash shells

### 0.3.0

- Added feature to run shell commands in dedicated terminals
- Each markdown file now gets its own terminal named "Markdown Shell Runner (index)"
- Added configuration option to choose between terminal and output channel
- Improved terminal management with automatic indexing

### 0.2.2

- Updated unit tests to cover the new working directory functionality
- Improved test coverage and reliability

### 0.2.1

- Added LICENSE file
- Improved packaging process to skip prompts
- Updated configuration for smoother development workflow

### 0.2.0

- Added feature to execute commands from the directory of the markdown file
- Improved output display to show the working directory
- Updated documentation with examples of the new feature

### 0.1.0

- Initial release
- Support for running shell code blocks
- Configurable language support
- Run button above shell code blocks
- Commands are executed from the directory of the markdown file

## Security Considerations

This extension executes shell commands on your system. Only run code that you trust and understand.

## License

MIT
