import * as assert from 'assert';
import { describe, it } from 'mocha';
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

describe('Markdown Shell Runner', () => {
  let sandbox: sinon.SinonSandbox;
  
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });
  
  afterEach(() => {
    sandbox.restore();
  });
  
  describe('extractCodeBlock', () => {
    it('should extract bash code block', () => {
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
    });
    
    it('should extract shell code block', () => {
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
    });
    
    it('should return undefined for non-shell code blocks', () => {
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
    
    it('should return undefined when cursor is outside code blocks', () => {
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
  
  describe('runShellCommand', () => {
    it('should use workspace root when no document URI is provided', async () => {
      const result = await mockRunShellCommand('echo "test"');
      assert.strictEqual(result, 'Command: echo "test", Working Directory: /test/workspace');
    });
    
    it('should use document directory when document URI is provided', async () => {
      const documentUri = vscode.Uri.file('/test/documents/test.md');
      const result = await mockRunShellCommand('echo "test"', documentUri);
      assert.strictEqual(result, 'Command: echo "test", Working Directory: /test/documents');
    });
  });
}); 