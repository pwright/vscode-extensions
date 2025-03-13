# Markdown Shell Runner Sample

This is a sample markdown file to test the Markdown Shell Runner extension.

## Shell Script Example

Place your cursor inside the code block below and look for the "▶ Run" button above the code block, or right-click to select "Run Shell Code Block":

```bash
echo "Hello, World!"
echo "Current directory:"
pwd
echo "Files in current directory:"
ls -la
```

The commands above will be executed from the directory where this markdown file is located.

## Python Code Example

Place your cursor inside the code block below and look for the "▶ Run Python" button above the code block:

```python
print("Hello from Python!")
print("Here's a simple calculation:")
for i in range(1, 6):
    print(f"{i} squared is {i**2}")

import os
print(f"Current working directory: {os.getcwd()}")
print("This directory contains:")
for item in os.listdir('.'):
    print(f"- {item}")
```

The Python code above will be executed and the output will be displayed in the "Markdown Python Runner" output channel.

## Another Python Example

```py
# This is also a Python script (using the 'py' language identifier)
import sys
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")

# Simple list comprehension
numbers = [x for x in range(1, 11)]
print(f"Numbers from 1 to 10: {numbers}")
```

## Another Example with Shell

```shell
# This is a shell script
echo "Current date and time:"
date
echo "System information:"
uname -a
```

## Example with sh

```sh
# This is an sh script
echo "Environment variables:"
env | grep PATH
echo "Working directory (should be the directory of this markdown file):"
pwd
```

## Example with zsh (if available)

```zsh
# This is a zsh script (will only work if zsh is installed)
echo "ZSH version:"
zsh --version 2>/dev/null || echo "ZSH not installed"
```

## Non-executable Code Block

This code block should not be executable by the extension (no run button should appear):

```javascript
console.log("This is JavaScript, not a shell script");
```

## Using the Run Button

The run button appears above shell code blocks and allows you to execute the code with a single click. This is a convenient way to run shell scripts without having to use the context menu.

## Terminal Usage

When you run a shell code block, the command will be executed in a dedicated terminal named "Markdown Shell Runner (index)". Each markdown file gets its own terminal, so commands from the same file will reuse the same terminal, while commands from different files will use different terminals.

For example, try running the following command:

```bash
echo "This command is running in a dedicated terminal"
```

Then open another markdown file and run a command there. You'll notice that a new terminal is created with a different index number.

## Working Directory

All commands are executed from the directory where the markdown file is located. This means that relative file paths in your commands will be resolved relative to the markdown file, not the workspace root.

For example, if your markdown file is located at `/path/to/docs/example.md`, and you run the following command:

```bash
ls -la
```

It will list the files in the `/path/to/docs/` directory.

## Extension Settings

You can customize the behavior of the extension in the VS Code settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "Markdown Shell Runner"
3. Configure the following settings:
   - **Enable Code Lens**: Enable or disable the run button above shell code blocks
   - **Use Terminal**: Run shell commands in a terminal instead of the output channel
   - **Enabled Languages**: Languages that can be executed from markdown code blocks

## Disabling the Run Button

If you prefer not to see the run button, you can disable it in the extension settings:

1. Open VS Code settings (File > Preferences > Settings)
2. Search for "Markdown Shell Runner"
3. Uncheck the "Enable Code Lens" option
