// Mock implementation of the vscode module for testing
export class Range {
  constructor(public start: any, public end: any) {}
}

export class Position {
  constructor(public line: number, public character: number) {}
}

export class Uri {
  static file(path: string): Uri {
    return new Uri(path);
  }
  
  constructor(public fsPath: string) {}
}

export class TextDocument {
  constructor(public content: string, public uri?: Uri) {
    if (!uri) {
      this.uri = Uri.file('/test/document.md');
    }
  }
  getText() {
    return this.content;
  }
  positionAt(offset: number) {
    // Simple implementation for testing
    const lines = this.content.substring(0, offset).split('\n');
    const line = lines.length - 1;
    const character = lines[line].length;
    return new Position(line, character);
  }
  offsetAt(position: any) {
    // Simple implementation for testing
    const lines = this.content.split('\n');
    let offset = 0;
    for (let i = 0; i < position.line; i++) {
      offset += lines[i].length + 1; // +1 for the newline
    }
    offset += position.character;
    return offset;
  }
}

export const workspace = {
  workspaceFolders: [{ uri: { fsPath: '/test/workspace' } }],
  getConfiguration: () => ({
    get: (key: string) => {
      if (key === 'enabledLanguages') {
        return ['shell', 'bash', 'sh', 'zsh'];
      }
      return null;
    }
  })
};

export const window = {
  showErrorMessage: () => {},
  showInformationMessage: () => {},
  createOutputChannel: () => ({
    show: () => {},
    appendLine: () => {}
  })
};

export const commands = {
  registerCommand: (_command: string, callback: () => void) => callback,
  executeCommand: () => {}
};

export class ExtensionContext {
  subscriptions: any[] = [];
}

export const ProgressLocation = {
  Notification: 1,
  Window: 2
}; 