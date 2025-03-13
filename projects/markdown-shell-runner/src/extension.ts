import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Map to track terminals for each file
const fileTerminals = new Map<string, vscode.Terminal>();
let terminalIndex = 0;

// Function to get or create a terminal for a specific file
function getOrCreateTerminal(documentUri: vscode.Uri): vscode.Terminal {
    const filePath = documentUri.fsPath;
    
    // Check if a terminal already exists for this file
    if (fileTerminals.has(filePath)) {
        return fileTerminals.get(filePath)!;
    }
    
    // Create a new terminal for this file
    const terminal = vscode.window.createTerminal({
        name: `Markdown Shell Runner (${terminalIndex})`,
        cwd: path.dirname(filePath),
        env: {
            // Set HISTCONTROL to ignore commands starting with space and duplicates
            HISTCONTROL: 'ignoreboth'
        }
    });
    
    // Store the terminal in the map
    fileTerminals.set(filePath, terminal);
    
    // Increment the terminal index for the next terminal
    terminalIndex++;
    
    return terminal;
}

// Function to extract code blocks from markdown
export function extractCodeBlock(document: vscode.TextDocument, position: vscode.Position): { code: string, language: string, range: vscode.Range } | undefined {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Regular expression to match complete markdown code blocks with content
    // This ensures that empty code blocks or incomplete blocks are not matched
    // Updated to include python and py languages
    const codeBlockRegex = /```(shell|bash|sh|zsh|python|py)\s*\n([\s\S]*?)\n\s*```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        if (startOffset <= offset && offset <= endOffset) {
            // Extract the language and code content
            const language = match[1];
            const code = match[2];
            
            // Calculate the range of the code block
            const startPos = document.positionAt(startOffset);
            const endPos = document.positionAt(endOffset);
            const range = new vscode.Range(startPos, endPos);
            
            return { code, language, range };
        }
    }
    
    return undefined;
}

// Function to find all shell code blocks in a document
export function findAllShellCodeBlocks(document: vscode.TextDocument): { code: string, language: string, range: vscode.Range }[] {
    const text = document.getText();
    const codeBlocks: { code: string, language: string, range: vscode.Range }[] = [];
    
    // Regular expression to match complete markdown code blocks with content
    // Updated to include python and py languages
    const codeBlockRegex = /```(shell|bash|sh|zsh|python|py)\s*\n([\s\S]*?)\n\s*```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        // Extract the language and code content
        const language = match[1];
        const code = match[2];
        
        // Calculate the range of the code block
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        const range = new vscode.Range(startPos, endPos);
        
        codeBlocks.push({ code, language, range });
    }
    
    return codeBlocks;
}

// Function to run shell command
export async function runShellCommand(command: string, documentUri?: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determine the shell to use based on the OS
        const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
        const shellArgs = os.platform() === 'win32' ? ['/c'] : ['-c'];
        
        // Determine the working directory
        let cwd: string | undefined;
        
        if (documentUri) {
            // Use the directory of the markdown file
            const filePath = documentUri.fsPath;
            cwd = path.dirname(filePath);
        } else {
            // Fallback to workspace root
            cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        }
        
        const childProcess = cp.spawn(shell, [...shellArgs, command], {
            env: { ...process.env },
            cwd: cwd
        });
        
        let stdout = '';
        let stderr = '';
        
        childProcess.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });
        
        childProcess.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });
        
        childProcess.on('close', (code: number | null) => {
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Command failed with exit code ${code}\n${stderr}`));
            }
        });
        
        childProcess.on('error', (err: Error) => {
            reject(err);
        });
    });
}

// Function to run Python code
export async function runPythonCode(code: string, documentUri?: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determine the working directory
        let cwd: string | undefined;
        
        if (documentUri) {
            // Use the directory of the markdown file
            const filePath = documentUri.fsPath;
            cwd = path.dirname(filePath);
        } else {
            // Fallback to workspace root
            cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
        }
        
        // Create a temporary Python file
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `markdown_python_${Date.now()}.py`);
        
        // Write the code to the temporary file
        fs.writeFileSync(tempFile, code);
        
        // Determine the Python executable
        const pythonCommand = os.platform() === 'win32' ? 'python' : 'python3';
        
        // Execute the Python file
        const childProcess = cp.spawn(pythonCommand, [tempFile], {
            env: { ...process.env },
            cwd: cwd
        });
        
        let stdout = '';
        let stderr = '';
        
        childProcess.stdout.on('data', (data: Buffer) => {
            stdout += data.toString();
        });
        
        childProcess.stderr.on('data', (data: Buffer) => {
            stderr += data.toString();
        });
        
        childProcess.on('close', (code: number | null) => {
            // Clean up the temporary file
            try {
                fs.unlinkSync(tempFile);
            } catch (err) {
                console.error('Failed to delete temporary Python file:', err);
            }
            
            if (code === 0) {
                resolve(stdout);
            } else {
                reject(new Error(`Python execution failed with exit code ${code}\n${stderr}`));
            }
        });
        
        childProcess.on('error', (err: Error) => {
            // Clean up the temporary file
            try {
                fs.unlinkSync(tempFile);
            } catch (cleanupErr) {
                console.error('Failed to delete temporary Python file:', cleanupErr);
            }
            
            reject(err);
        });
    });
}

// CodeLens provider for shell code blocks
class ShellCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        // Updated regex to match only complete code blocks with content
        // Including Python code blocks
        this.regex = /```(shell|bash|sh|zsh|python|py)\s*\n([\s\S]*?)\n\s*```/g;
        
        // Watch for document changes to refresh code lenses
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.languageId === 'markdown') {
                this._onDidChangeCodeLenses.fire();
            }
        });
        
        // Watch for configuration changes to refresh code lenses
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('markdownShellRunner.enableCodeLens')) {
                this._onDidChangeCodeLenses.fire();
            }
        });
    }

    public provideCodeLenses(document: vscode.TextDocument, token: vscode.CancellationToken): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
        if (document.languageId !== 'markdown') {
            return [];
        }
        
        // Check if CodeLens is enabled
        const config = vscode.workspace.getConfiguration('markdownShellRunner');
        const enableCodeLens = config.get<boolean>('enableCodeLens');
        
        if (!enableCodeLens) {
            return [];
        }

        this.codeLenses = [];
        const text = document.getText();
        let matches;
        
        while ((matches = this.regex.exec(text)) !== null) {
            // Get the line of the opening code fence
            const line = document.lineAt(document.positionAt(matches.index).line);
            const position = new vscode.Position(line.lineNumber, 0);
            
            const range = new vscode.Range(position, position);
            
            // Only add CodeLens if there's actual content in the code block
            if (matches[2] && matches[2].trim().length > 0) {
                // Determine the language
                const language = matches[1];
                const isPythonBlock = ['python', 'py'].includes(language);
                
                // Set the title based on the language
                const title = isPythonBlock ? "▶ Run Python" : "▶ Run";
                const tooltip = isPythonBlock ? "Run this Python code block" : "Run this shell code block";
                
                this.codeLenses.push(new vscode.CodeLens(range, {
                    title: title,
                    tooltip: tooltip,
                    command: "markdown-shell-runner.runCodeBlockAtPosition",
                    arguments: [document.uri, position]
                }));
            }
        }
        
        return this.codeLenses;
    }
}

// Function to execute a shell code block
async function executeShellCodeBlock(document: vscode.TextDocument, position: vscode.Position, enabledLanguages: string[]) {
    const codeBlock = extractCodeBlock(document, position);
    
    if (!codeBlock) {
        vscode.window.showErrorMessage('No code block found at cursor position');
        return;
    }
    
    if (!enabledLanguages.includes(codeBlock.language)) {
        vscode.window.showErrorMessage(`Language '${codeBlock.language}' is not enabled for execution`);
        return;
    }
    
    // Get the configuration
    const config = vscode.workspace.getConfiguration('markdownShellRunner');
    const useTerminal = config.get<boolean>('useTerminal', true);
    
    // Check if it's a Python code block
    const isPythonBlock = ['python', 'py'].includes(codeBlock.language);
    
    if (isPythonBlock) {
        // Python code blocks are always executed in the output channel
        const outputChannel = vscode.window.createOutputChannel('Markdown Python Runner');
        outputChannel.show();
        outputChannel.appendLine(`Executing ${codeBlock.language} code block:`);
        outputChannel.appendLine('----------------------------------------');
        outputChannel.appendLine(codeBlock.code);
        outputChannel.appendLine('----------------------------------------');
        
        try {
            // Run the Python code
            const result = await runPythonCode(codeBlock.code, document.uri);
            
            // Display the result
            outputChannel.appendLine('Output:');
            outputChannel.appendLine('----------------------------------------');
            outputChannel.appendLine(result);
            outputChannel.appendLine('----------------------------------------');
            outputChannel.appendLine('Python code executed successfully');
            outputChannel.appendLine(`Working directory: ${path.dirname(document.uri.fsPath)}`);
        } catch (error) {
            if (error instanceof Error) {
                outputChannel.appendLine(`Error: ${error.message}`);
            } else {
                outputChannel.appendLine(`Unknown error occurred`);
            }
        }
        return;
    }
    
    // For shell code blocks
    if (useTerminal) {
        // Get or create a terminal for this file
        const terminal = getOrCreateTerminal(document.uri);
        
        // Show the terminal
        terminal.show();
        
        // Determine the shell type
        const isWindows = os.platform() === 'win32';
        
        if (!isWindows) {
            // For non-Windows systems, first set the shell to ignore history expansion
            terminal.sendText('set +H', true);
        }
        
        // Escape exclamation marks in the code
        const escapedCode = codeBlock.code.replace(/!/g, '\\!');
        
        // Send the command to the terminal
        terminal.sendText(escapedCode);
    } else {
        // Create and show output channel
        const outputChannel = vscode.window.createOutputChannel('Markdown Shell Runner');
        outputChannel.show();
        outputChannel.appendLine(`Executing ${codeBlock.language} code block:`);
        outputChannel.appendLine('----------------------------------------');
        outputChannel.appendLine(codeBlock.code);
        outputChannel.appendLine('----------------------------------------');
        
        try {
            // Run the command from the directory of the markdown file
            const result = await runShellCommand(codeBlock.code, document.uri);
            
            // Display the result
            outputChannel.appendLine('Output:');
            outputChannel.appendLine('----------------------------------------');
            outputChannel.appendLine(result);
            outputChannel.appendLine('----------------------------------------');
            outputChannel.appendLine('Command executed successfully');
            outputChannel.appendLine(`Working directory: ${path.dirname(document.uri.fsPath)}`);
        } catch (error) {
            if (error instanceof Error) {
                outputChannel.appendLine(`Error: ${error.message}`);
            } else {
                outputChannel.appendLine(`Unknown error occurred`);
            }
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Shell Runner is now active');
    
    // Get the enabled languages from configuration
    const config = vscode.workspace.getConfiguration('markdownShellRunner');
    const enabledLanguages: string[] = config.get('enabledLanguages') || ['shell', 'bash', 'sh', 'zsh', 'python', 'py'];
    
    // Register the CodeLens provider
    const codeLensProvider = new ShellCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'markdown' },
            codeLensProvider
        )
    );
    
    // Listen for terminal close events to remove them from the map
    context.subscriptions.push(
        vscode.window.onDidCloseTerminal(terminal => {
            // Find and remove the closed terminal from the map
            for (const [filePath, t] of fileTerminals.entries()) {
                if (t === terminal) {
                    fileTerminals.delete(filePath);
                    break;
                }
            }
        })
    );
    
    // Register the command to run code blocks at a specific position
    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-shell-runner.runCodeBlockAtPosition', async (uri: vscode.Uri, position: vscode.Position) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await executeShellCodeBlock(document, position, enabledLanguages);
        })
    );
    
    // Register the command to run code blocks
    const disposable = vscode.commands.registerCommand('markdown-shell-runner.runCodeBlock', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor || editor.document.languageId !== 'markdown') {
            vscode.window.showErrorMessage('This command only works in markdown files');
            return;
        }
        
        const position = editor.selection.active;
        await executeShellCodeBlock(editor.document, position, enabledLanguages);
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up resources
} 