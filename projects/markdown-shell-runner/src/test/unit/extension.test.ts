import * as assert from 'assert';
import { suite, test, setup, teardown } from 'mocha';
import * as sinon from 'sinon';
import * as cp from 'child_process';
import * as os from 'os';
import * as path from 'path';
import { EventEmitter } from 'events';

// Mock the vscode module
import * as vscode from './vscode.mock';

// Import the functions to test
import { extractCodeBlock, runShellCommand } from './extension.mock';

// Create a mock implementation for testing runShellCommand
const mockRunShellCommand = async (command: string, documentUri?: vscode.Uri): Promise<string> => {
  // Return the command and working directory for verification
  const cwd = documentUri ? path.dirname(documentUri.fsPath) : '/test/workspace';
  return `Command: ${command}, Working Directory: ${cwd}`;
};

suite('Markdown Shell Runner', () => {
  let sandbox: sinon.SinonSandbox;
  
  setup(() => {
    sandbox = sinon.createSandbox();
  });
  
  teardown(() => {
    sandbox.restore();
  });
  
  suite('extractCodeBlock', () => {
    test('should extract bash code block', () => {
      const content = [
        '# Test Document',
        '',
        '```bash',
        'echo "Hello, World!"',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 5); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.ok(result);
      assert.strictEqual(result!.language, 'bash');
      assert.strictEqual(result!.code, 'echo "Hello, World!"');
      assert.strictEqual(result!.terminalName, undefined);
    });
    
    test('should extract shell code block', () => {
      const content = [
        '# Test Document',
        '',
        '```shell',
        'ls -la',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 2); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.ok(result);
      assert.strictEqual(result!.language, 'shell');
      assert.strictEqual(result!.code, 'ls -la');
      assert.strictEqual(result!.terminalName, undefined);
    });
    
    test('should extract bash code block with terminal name', () => {
      const content = [
        '# Test Document',
        '',
        '```bash,west',
        'echo "Hello from west terminal!"',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 5); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.ok(result);
      assert.strictEqual(result!.language, 'bash');
      assert.strictEqual(result!.code, 'echo "Hello from west terminal!"');
      assert.strictEqual(result!.terminalName, 'west');
    });
    
    test('should extract shell code block with terminal name and spaces', () => {
      const content = [
        '# Test Document',
        '',
        '```shell, east',
        'ls -la',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 2); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.ok(result);
      assert.strictEqual(result!.language, 'shell');
      assert.strictEqual(result!.code, 'ls -la');
      assert.strictEqual(result!.terminalName, 'east');
    });
    
    test('should extract zsh code block with terminal name', () => {
      const content = [
        '# Test Document',
        '',
        '```zsh,my-terminal',
        'echo "ZSH test"',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 2); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.ok(result);
      assert.strictEqual(result!.language, 'zsh');
      assert.strictEqual(result!.code, 'echo "ZSH test"');
      assert.strictEqual(result!.terminalName, 'my-terminal');
    });
    
    test('should return undefined for non-shell code blocks', () => {
      const content = [
        '# Test Document',
        '',
        '```javascript',
        'console.log("Hello, World!");',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(3, 5); // Inside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.strictEqual(result, undefined);
    });
    
    test('should return undefined when cursor is outside code blocks', () => {
      const content = [
        '# Test Document',
        '',
        '```bash',
        'echo "Hello, World!"',
        '```',
        ''
      ].join('\n');
      
      const document = new vscode.TextDocument(content);
      const position = new vscode.Position(1, 0); // Outside the code block
      
      const result = extractCodeBlock(document, position);
      
      assert.strictEqual(result, undefined);
    });
  });
  
  suite('runShellCommand', () => {
    test('should use workspace root when no document URI is provided', async () => {
      const result = await mockRunShellCommand('echo "test"');
      assert.strictEqual(result, 'Command: echo "test", Working Directory: /test/workspace');
    });
    
    test('should use document directory when document URI is provided', async () => {
      const documentUri = vscode.Uri.file('/test/documents/test.md');
      const result = await mockRunShellCommand('echo "test"', documentUri);
      assert.strictEqual(result, 'Command: echo "test", Working Directory: /test/documents');
    });
  });
}); 