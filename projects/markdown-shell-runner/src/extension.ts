import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';

// Function to extract code blocks from markdown
export function extractCodeBlock(document: vscode.TextDocument, position: vscode.Position): { code: string, language: string, range: vscode.Range } | undefined {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Regular expression to match markdown code blocks
    const codeBlockRegex = /```(shell|bash|sh|zsh)[\s\S]*?```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        if (startOffset <= offset && offset <= endOffset) {
            // Extract the language and code content
            const fullMatch = match[0];
            const language = match[1];
            
            // Extract the code content (remove the opening and closing ```)
            const codeLines = fullMatch.split('\n');
            const code = codeLines.slice(1, codeLines.length - 1).join('\n');
            
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
    
    // Regular expression to match markdown code blocks
    const codeBlockRegex = /```(shell|bash|sh|zsh)[\s\S]*?```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        // Extract the language and code content
        const fullMatch = match[0];
        const language = match[1];
        
        // Extract the code content (remove the opening and closing ```)
        const codeLines = fullMatch.split('\n');
        const code = codeLines.slice(1, codeLines.length - 1).join('\n');
        
        // Calculate the range of the code block
        const startPos = document.positionAt(startOffset);
        const endPos = document.positionAt(endOffset);
        const range = new vscode.Range(startPos, endPos);
        
        codeBlocks.push({ code, language, range });
    }
    
    return codeBlocks;
}

// Function to run shell command
export async function runShellCommand(command: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Determine the shell to use based on the OS
        const shell = os.platform() === 'win32' ? 'cmd.exe' : '/bin/sh';
        const shellArgs = os.platform() === 'win32' ? ['/c'] : ['-c'];
        
        const childProcess = cp.spawn(shell, [...shellArgs, command], {
            env: { ...process.env },
            cwd: vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
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

// CodeLens provider for shell code blocks
class ShellCodeLensProvider implements vscode.CodeLensProvider {
    private codeLenses: vscode.CodeLens[] = [];
    private regex: RegExp;
    private _onDidChangeCodeLenses: vscode.EventEmitter<void> = new vscode.EventEmitter<void>();
    public readonly onDidChangeCodeLenses: vscode.Event<void> = this._onDidChangeCodeLenses.event;

    constructor() {
        this.regex = /```(shell|bash|sh|zsh)/g;
        
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
            const line = document.lineAt(document.positionAt(matches.index).line);
            const position = new vscode.Position(line.lineNumber, 0);
            
            const range = new vscode.Range(position, position);
            
            this.codeLenses.push(new vscode.CodeLens(range, {
                title: "▶ Run",
                tooltip: "Run this shell code block",
                command: "markdown-shell-runner.runCodeBlockAtPosition",
                arguments: [document.uri, position]
            }));
        }
        
        return this.codeLenses;
    }
}

// Function to execute a shell code block
async function executeShellCodeBlock(document: vscode.TextDocument, position: vscode.Position, enabledLanguages: string[]) {
    const codeBlock = extractCodeBlock(document, position);
    
    if (!codeBlock) {
        vscode.window.showErrorMessage('No shell code block found at cursor position');
        return;
    }
    
    if (!enabledLanguages.includes(codeBlock.language)) {
        vscode.window.showErrorMessage(`Language '${codeBlock.language}' is not enabled for execution`);
        return;
    }
    
    // Create and show output channel
    const outputChannel = vscode.window.createOutputChannel('Markdown Shell Runner');
    outputChannel.show();
    outputChannel.appendLine(`Executing ${codeBlock.language} code block:`);
    outputChannel.appendLine('----------------------------------------');
    outputChannel.appendLine(codeBlock.code);
    outputChannel.appendLine('----------------------------------------');
    
    try {
        // Run the command
        const result = await runShellCommand(codeBlock.code);
        
        // Display the result
        outputChannel.appendLine('Output:');
        outputChannel.appendLine('----------------------------------------');
        outputChannel.appendLine(result);
        outputChannel.appendLine('----------------------------------------');
        outputChannel.appendLine('Command executed successfully');
    } catch (error) {
        if (error instanceof Error) {
            outputChannel.appendLine(`Error: ${error.message}`);
        } else {
            outputChannel.appendLine(`Unknown error occurred`);
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Shell Runner is now active');
    
    // Get the enabled languages from configuration
    const config = vscode.workspace.getConfiguration('markdownShellRunner');
    const enabledLanguages: string[] = config.get('enabledLanguages') || ['shell', 'bash', 'sh', 'zsh'];
    
    // Register the CodeLens provider
    const codeLensProvider = new ShellCodeLensProvider();
    context.subscriptions.push(
        vscode.languages.registerCodeLensProvider(
            { language: 'markdown' },
            codeLensProvider
        )
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