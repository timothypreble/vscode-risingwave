const vscode = require('vscode');
const { risingwaveKeywordDocs, findCompoundKeywordAt, findDoc, completionLists } = require('./lib/keywords');

// Helper function to get word at cursor position
function getWordAtPosition(document, position) {
  // Try to get multiple words (for compound keywords like "CREATE SOURCE")
  // Returns candidates in priority order: compound keyword (if any), then single word.
  const lineText = document.lineAt(position.line).text;
  const candidates = [];
  const compound = findCompoundKeywordAt(lineText, position.character);
  if (compound) {
    candidates.push({
      word: compound.keyword,
      range: new vscode.Range(position.line, compound.start, position.line, compound.end)
    });
  }

  // Get single word
  const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_-]*/);
  if (wordRange) {
    candidates.push({ word: document.getText(wordRange).toLowerCase(), range: wordRange });
  }

  return candidates;
}

// Create hover content
function createHoverContent(keyword, docEntry, range) {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = true;
  markdown.supportHtml = true;

  // Title
  markdown.appendMarkdown(`### ${keyword}\n\n`);

  // Description
  markdown.appendMarkdown(`${docEntry.description}\n\n`);

  // Syntax
  if (docEntry.syntax) {
    markdown.appendMarkdown(`**Syntax:**\n\`\`\`sql\n${docEntry.syntax}\n\`\`\`\n\n`);
  }

  // Parameters
  if (docEntry.parameters) {
    markdown.appendMarkdown(`**Parameters:**\n\`\`\`\n${docEntry.parameters}\n\`\`\`\n\n`);
  }

  // Example
  if (docEntry.example) {
    markdown.appendMarkdown(`**Example:**\n\`\`\`sql\n${docEntry.example}\n\`\`\`\n\n`);
  }

  // Doc link
  if (docEntry.docUrl) {
    markdown.appendMarkdown(`[📖 Documentation](${docEntry.docUrl})`);
  }

  return new vscode.Hover(markdown, range);
}

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

  // Register hover provider for RisingWave SQL
  const hoverProvider = vscode.languages.registerHoverProvider('risingwave-sql', {
    provideHover(document, position, token) {
      // Check in documentation database (compound keyword first, then single word)
      for (const { word, range } of getWordAtPosition(document, position)) {
        const doc = findDoc(word);
        if (doc) return createHoverContent(doc.keyword, doc.docEntry, range);
      }

      return null;
    }
  });
  context.subscriptions.push(hoverProvider);

  // Register completion provider for connectors and parameters
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'risingwave-sql',
    {
      provideCompletionItems(document, position, token, context) {
        const completions = [];

        // Connector completions
        for (const conn of completionLists.connectors) {
          const item = new vscode.CompletionItem(conn, vscode.CompletionItemKind.Constant);
          item.detail = 'RisingWave Connector';
          if (risingwaveKeywordDocs[conn]) {
            item.documentation = new vscode.MarkdownString(risingwaveKeywordDocs[conn].description);
          }
          completions.push(item);
        }

        // Format completions
        for (const fmt of completionLists.formats) {
          const item = new vscode.CompletionItem(fmt, vscode.CompletionItemKind.Keyword);
          item.detail = 'Data Format';
          completions.push(item);
        }

        // Encoding completions
        for (const enc of completionLists.encodings) {
          const item = new vscode.CompletionItem(enc, vscode.CompletionItemKind.Keyword);
          item.detail = 'Data Encoding';
          completions.push(item);
        }

        // RisingWave keywords
        for (const kw of completionLists.keywords) {
          const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
          item.detail = 'RisingWave Keyword';
          if (risingwaveKeywordDocs[kw]) {
            item.documentation = new vscode.MarkdownString(risingwaveKeywordDocs[kw].description);
          }
          completions.push(item);
        }

        return completions;
      }
    },
    "'", // Trigger on quote for connector names
    '=' // Trigger on equals for assignments
  );
  context.subscriptions.push(completionProvider);

  console.log('RisingWave SQL extension activated');
}

function deactivate() {
  console.log('RisingWave SQL extension deactivated');
}

module.exports = { activate, deactivate };
