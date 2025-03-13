import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

// Map to track terminals for each file
const fileTerminals = new Map<string, vscode.Terminal>();
let terminalIndex = 0;

// Class to manage Python WebView panel
class PythonPanel {
    private static instance: PythonPanel | undefined;
    private panel: vscode.WebviewPanel | undefined;
    private disposables: vscode.Disposable[] = [];
    private currentCode: string = '';
    private currentDocumentUri: vscode.Uri | undefined;

    private constructor(private context: vscode.ExtensionContext) {}

    public static getInstance(context: vscode.ExtensionContext): PythonPanel {
        if (!PythonPanel.instance) {
            PythonPanel.instance = new PythonPanel(context);
        }
        return PythonPanel.instance;
    }

    public show(code: string, result: string, workingDir: string, documentUri?: vscode.Uri): void {
        // Store current code and document URI for re-running
        this.currentCode = code;
        this.currentDocumentUri = documentUri;

        const columnToShowIn = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (this.panel) {
            // If we already have a panel, show it in the target column
            this.panel.reveal(columnToShowIn);
            this.updateContent(code, result, workingDir);
        } else {
            // Otherwise, create a new panel
            this.panel = vscode.window.createWebviewPanel(
                'pythonRunner',
                'Python Runner',
                columnToShowIn || vscode.ViewColumn.One,
                {
                    // Enable scripts in the webview
                    enableScripts: true,
                    retainContextWhenHidden: true,
                    localResourceRoots: [
                        vscode.Uri.joinPath(this.context.extensionUri, 'media')
                    ]
                }
            );

            // Set the webview's initial html content
            this.updateContent(code, result, workingDir);

            // Listen for when the panel is disposed
            // This happens when the user closes the panel or when the panel is closed programmatically
            this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(async (message: { command: string }) => {
                if (message.command === 'runAgain') {
                    await this.runCodeAgain();
                }
            }, null, this.disposables);
        }
    }

    private async runCodeAgain(): Promise<void> {
        if (!this.currentCode || !this.currentDocumentUri) {
            vscode.window.showErrorMessage('No code to run');
            return;
        }

        try {
            // Show loading state
            if (this.panel) {
                this.panel.webview.postMessage({ command: 'setLoading', value: true });
            }

            // Run the Python code
            const result = await runPythonCode(this.currentCode, this.currentDocumentUri);
            
            // Get the working directory
            const workingDir = path.dirname(this.currentDocumentUri.fsPath);
            
            // Update the panel with the new result
            this.updateContent(this.currentCode, result, workingDir);
            
            // Hide loading state
            if (this.panel) {
                this.panel.webview.postMessage({ command: 'setLoading', value: false });
            }
        } catch (error) {
            // Hide loading state
            if (this.panel) {
                this.panel.webview.postMessage({ command: 'setLoading', value: false });
            }

            // Show error in the panel
            let errorMessage = 'Unknown error occurred';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            
            if (this.panel) {
                this.panel.webview.postMessage({ 
                    command: 'showError', 
                    value: errorMessage 
                });
            }
        }
    }

    private updateContent(code: string, result: string, workingDir: string): void {
        if (this.panel) {
            this.panel.webview.html = this.getWebviewContent(code, result, workingDir);
        }
    }

    private getWebviewContent(code: string, result: string, workingDir: string): string {
        // Escape HTML to prevent XSS
        const escapeHtml = (text: string): string => {
            return text
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#039;');
        };

        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Python Runner</title>
            <style>
                body {
                    font-family: var(--vscode-editor-font-family);
                    font-size: var(--vscode-editor-font-size);
                    padding: 0;
                    margin: 0;
                    color: var(--vscode-editor-foreground);
                    background-color: var(--vscode-editor-background);
                }
                .container {
                    padding: 20px;
                }
                .section {
                    margin-bottom: 20px;
                }
                .section-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: var(--vscode-editor-foreground);
                }
                .code-block, .result-block {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 10px;
                    border-radius: 5px;
                    overflow: auto;
                    white-space: pre;
                    font-family: var(--vscode-editor-font-family);
                }
                .info {
                    font-style: italic;
                    margin-top: 10px;
                    color: var(--vscode-descriptionForeground);
                }
                .run-button {
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    padding: 8px 12px;
                    border-radius: 2px;
                    cursor: pointer;
                    margin-top: 10px;
                }
                .run-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                .loading {
                    display: none;
                    margin-left: 10px;
                    font-style: italic;
                }
                .error {
                    color: var(--vscode-errorForeground);
                    margin-top: 10px;
                    display: none;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="section">
                    <div class="section-title">Python Code:</div>
                    <div class="code-block">${escapeHtml(code)}</div>
                    <button class="run-button" id="runButton">Run Again</button>
                    <span class="loading" id="loading">Running...</span>
                    <div class="error" id="error"></div>
                </div>
                <div class="section">
                    <div class="section-title">Output:</div>
                    <div class="result-block">${escapeHtml(result)}</div>
                </div>
                <div class="info">
                    Working directory: ${escapeHtml(workingDir)}
                </div>
            </div>
            <script>
                const vscode = acquireVsCodeApi();
                const runButton = document.getElementById('runButton');
                const loading = document.getElementById('loading');
                const error = document.getElementById('error');

                runButton.addEventListener('click', () => {
                    vscode.postMessage({
                        command: 'runAgain'
                    });
                });

                // Handle messages sent from the extension to the webview
                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.command) {
                        case 'setLoading':
                            if (message.value) {
                                loading.style.display = 'inline';
                                runButton.disabled = true;
                                error.style.display = 'none';
                            } else {
                                loading.style.display = 'none';
                                runButton.disabled = false;
                            }
                            break;
                        case 'showError':
                            error.textContent = message.value;
                            error.style.display = 'block';
                            break;
                    }
                });
            </script>
        </body>
        </html>`;
    }

    public dispose(): void {
        PythonPanel.instance = undefined;
        
        // Clean up our resources
        if (this.panel) {
            this.panel.dispose();
        }

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}

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
async function executeShellCodeBlock(document: vscode.TextDocument, position: vscode.Position, enabledLanguages: string[], context: vscode.ExtensionContext) {
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
        // Get the configuration for Python WebView
        const usePythonWebView = config.get<boolean>('usePythonWebView', true);
        
        try {
            // Run the Python code
            const result = await runPythonCode(codeBlock.code, document.uri);
            
            // Get the working directory
            const workingDir = path.dirname(document.uri.fsPath);
            
            if (usePythonWebView) {
                // Show the result in the Python panel
                PythonPanel.getInstance(context).show(codeBlock.code, result, workingDir, document.uri);
            } else {
                // Show the result in the output channel
                const outputChannel = vscode.window.createOutputChannel('Markdown Python Runner');
                outputChannel.show();
                outputChannel.appendLine(`Executing ${codeBlock.language} code block:`);
                outputChannel.appendLine('----------------------------------------');
                outputChannel.appendLine(codeBlock.code);
                outputChannel.appendLine('----------------------------------------');
                outputChannel.appendLine('Output:');
                outputChannel.appendLine('----------------------------------------');
                outputChannel.appendLine(result);
                outputChannel.appendLine('----------------------------------------');
                outputChannel.appendLine('Python code executed successfully');
                outputChannel.appendLine(`Working directory: ${workingDir}`);
            }
        } catch (error) {
            // Create an output channel for errors
            const outputChannel = vscode.window.createOutputChannel('Markdown Python Runner');
            outputChannel.show();
            outputChannel.appendLine(`Error executing Python code:`);
            outputChannel.appendLine('----------------------------------------');
            outputChannel.appendLine(codeBlock.code);
            outputChannel.appendLine('----------------------------------------');
            
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
    
    // Listen for configuration changes
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('markdownShellRunner.enabledLanguages')) {
                // Update the enabled languages
                const config = vscode.workspace.getConfiguration('markdownShellRunner');
                const newEnabledLanguages = config.get<string[]>('enabledLanguages') || ['shell', 'bash', 'sh', 'zsh', 'python', 'py'];
                
                // Update the enabledLanguages array
                enabledLanguages.length = 0;
                enabledLanguages.push(...newEnabledLanguages);
            }
        })
    );
    
    // Register the command to run code blocks at a specific position
    context.subscriptions.push(
        vscode.commands.registerCommand('markdown-shell-runner.runCodeBlockAtPosition', async (uri: vscode.Uri, position: vscode.Position) => {
            const document = await vscode.workspace.openTextDocument(uri);
            await executeShellCodeBlock(document, position, enabledLanguages, context);
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
        await executeShellCodeBlock(editor.document, position, enabledLanguages, context);
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up resources
} 