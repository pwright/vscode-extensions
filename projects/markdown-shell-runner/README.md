# Markdown Shell Runner

A Visual Studio Code extension that allows you to run shell scripts and Python code directly from markdown code blocks.

## Features

- Run shell scripts and Python code from markdown code blocks with a simple run button or right-click
- Supports `shell`, `bash`, `sh`, `zsh`, `python`, and `py` code blocks
- Execute shell commands in dedicated terminals or view output in the output channel
- Python code is executed and output is displayed in a dedicated output channel
- Each markdown file gets its own terminal for running shell commands
- Configurable supported languages
- Commands are executed from the directory of the markdown file

## Usage

### Using the Run Button

1. Open a markdown file in VS Code
2. Look for the "▶ Run" or "▶ Run Python" button that appears above code blocks:

   ![Run Button](images/run-button.png)

3. Click the run button to execute the code block
4. Shell commands will run in a dedicated terminal named "Markdown Shell Runner (index)"
5. Python code will run and display output in the "Markdown Python Runner" output channel

### Using the Context Menu

1. Open a markdown file in VS Code
2. Place your cursor inside a code block like:

   ````markdown
   ```bash
   echo "Hello, World!"
   ls -la
   ```
   ````

   Or for Python:

   ````markdown
   ```python
   print("Hello, World!")
   for i in range(5):
       print(f"Number: {i}")
   ```
   ````

3. Right-click and select "Run Shell Code Block" from the context menu
4. Shell commands will run in a dedicated terminal, while Python code will display output in the output channel

### Terminal Management

- Each markdown file gets its own dedicated terminal for shell commands
- Terminals are named "Markdown Shell Runner (index)" where index starts from 0
- When you run commands from the same file, they will reuse the same terminal
- When you run commands from a different file, a new terminal will be created with an incremented index
- Python code always runs in the output channel, not in a terminal

## Extension Settings

This extension contributes the following settings:

- `markdownShellRunner.enabledLanguages`: Array of languages that can be executed from markdown code blocks (default: `["shell", "bash", "sh", "zsh", "python", "py"]`)
- `markdownShellRunner.enableCodeLens`: Enable or disable the run button above code blocks (default: `true`)
- `markdownShellRunner.useTerminal`: Run shell commands in a terminal instead of the output channel (default: `true`)

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

For detailed release notes, see the [CHANGELOG.md](CHANGELOG.md) file.

## Security Considerations

This extension executes shell commands on your system. Only run code that you trust and understand.

## License

MIT
