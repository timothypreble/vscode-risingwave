const vscode = require('vscode');

function activate(context) {
  // Register file decoration provider for .rw files
  const decorationProvider = vscode.window.registerFileDecorationProvider({
    provideFileDecoration(uri) {
      if (uri.fsPath.endsWith('.rw')) {
        return {
          badge: 'RW',
          tooltip: 'RisingWave SQL file',
          color: new vscode.ThemeColor('charts.orange')
        };
      }
      return null;
    }
  });

  context.subscriptions.push(decorationProvider);
}

function deactivate() {
  // Extension cleanup if needed
}

module.exports = { activate, deactivate };
