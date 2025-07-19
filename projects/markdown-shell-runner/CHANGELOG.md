# Change Log

All notable changes to the "Markdown Shell Runner" extension will be documented in this file.

## [0.6.0] - 2024-07-03

- Added support for terminal name parameters in shell code blocks
- Shell code blocks can now specify a custom terminal name using syntax like `bash,west`
- Code blocks with the same terminal name will reuse the same terminal
- Updated run button tooltips to show terminal names when specified
- Improved terminal management to support named terminals alongside file-based terminals

## [0.5.1] - 2024-07-03

- Updated test configuration to use vscode-test for more reliable testing
- Fixed test runner configuration to properly work with @vscode/test-cli
- Added automatic cleanup of test environment before running tests
- Improved test runner setup for better integration with VS Code extension testing

## [0.5.0] - 2024-07-02

- Added support for running Python code blocks
- Added Python language detection for `python` and `py` code blocks
- Python code execution results are displayed in a dedicated output channel
- Updated documentation to include Python code execution examples

## [0.3.2] - 2024-07-01

- Fixed issue where run button would appear for incomplete code blocks
- Improved code block detection to only recognize complete blocks with content
- Enhanced regex patterns to ensure proper parsing of shell code blocks

## [0.3.1] - 2024-06-30

- Fixed issue with exclamation marks in shell commands causing quote mismatching
- Improved terminal handling to properly escape special characters
- Added support for disabling history expansion in bash shells

## [0.3.0] - 2024-06-29

- Added feature to run shell commands in dedicated terminals
- Each markdown file now gets its own terminal named "Markdown Shell Runner (index)"
- Added configuration option to choose between terminal and output channel
- Improved terminal management with automatic indexing

## [0.2.2] - 2024-06-28

- Updated unit tests to cover the new working directory functionality
- Improved test coverage and reliability

## [0.2.1] - 2024-06-27

- Added LICENSE file
- Improved packaging process to skip prompts
- Updated configuration for smoother development workflow

## [0.2.0] - 2024-06-26

- Added feature to execute commands from the directory of the markdown file
- Improved output display to show the working directory
- Updated documentation with examples of the new feature

## [0.1.0] - 2024-06-25

- Initial release
- Support for running shell code blocks
- Configurable language support
- Run button above shell code blocks
- Commands are executed from the directory of the markdown file 