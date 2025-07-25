import * as vscode from './vscode.mock';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';

// Function to extract code blocks from markdown
export function extractCodeBlock(document: vscode.TextDocument, position: vscode.Position): { code: string, language: string, terminalName?: string, range: vscode.Range } | undefined {
    const text = document.getText();
    const offset = document.offsetAt(position);
    
    // Regular expression to match markdown code blocks with optional terminal name parameter (space-separated)
    const codeBlockRegex = /```(shell|bash|sh|zsh|python|py)(?:\s+([a-zA-Z0-9_-]+))?\s*\n([\s\S]*?)\n\s*```/g;
    
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        const startOffset = match.index;
        const endOffset = match.index + match[0].length;
        
        if (startOffset <= offset && offset <= endOffset) {
            // Extract the language, optional terminal name, and code content
            const language = match[1];
            const terminalName = match[2]; // This will be undefined if no terminal name is provided
            const code = match[3];
            
            // Calculate the range of the code block
            const startPos = document.positionAt(startOffset);
            const endPos = document.positionAt(endOffset);
            const range = new vscode.Range(startPos, endPos);
            
            return { code, language, terminalName, range };
        }
    }
    
    return undefined;
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

export function activate(context: vscode.ExtensionContext) {
    console.log('Markdown Shell Runner is now active');
    
    // Get the enabled languages from configuration
    const config = vscode.workspace.getConfiguration();
    const enabledLanguages: string[] = ['shell', 'bash', 'sh', 'zsh'];
    
    // Register the command to run code blocks
    const disposable = vscode.commands.registerCommand('markdown-shell-runner.runCodeBlock', () => {
        // Implementation omitted for testing
    });
    
    context.subscriptions.push(disposable);
}

export function deactivate() {
    // Clean up resources
} 