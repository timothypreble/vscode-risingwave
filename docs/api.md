# API surface

**There is no HTTP API, so there is no OpenAPI spec.** The extension exposes no REST/GraphQL/RPC endpoints, opens no sockets, runs no server and makes no outbound requests (the "Documentation" links in hover are plain markdown links that VS Code opens in the browser). Writing an OpenAPI-v3 file for it would mean describing endpoints that do not exist, so none is provided.

What the extension *does* expose is a VS Code **contribution contract**. That is what other tooling (VS Code, themes, other extensions) can rely on, and it is documented here instead.

See also: [architecture](architecture.md) · [UI & theming](frontend.md)

## Extension identity

| Field | Value |
|---|---|
| Name / id | `USXpress.risingwave-sql` (`publisher.name`) |
| Display name | RisingWave SQL |
| Version | `0.2.0` (see [CHANGELOG](../CHANGELOG.md); `[Unreleased]` pending) |
| Engine | `vscode ^1.70.0` |
| Entry point | `./extension.js` (CommonJS, exports `activate` / `deactivate`) |
| Activation | `onLanguage:risingwave-sql` |
| Categories | Programming Languages, Snippets |
| Distribution | `.vsix` via GitHub Releases (not published to the Marketplace) |

## Contribution points (`package.json` → `contributes`)

| Point | ID / value | Details |
|---|---|---|
| `languages` | `risingwave-sql` | Aliases `RisingWave SQL`, `rw`, `risingwave`; extension `.rw`; configuration `language-configuration.json`; icon `icons/rw.svg` (light and dark) |
| `grammars` | scope `source.risingwave-sql` | `syntaxes/risingwave.tmLanguage.json` |
| `snippets` | `risingwave-sql` | `risingwave.json`, `postgres.json`, `misc.json` |
| `snippets` | `sql` | `postgres.json`, `misc.json` |
| `themes` | `RisingWave Theme` (`vs-dark`) | `themes/risingwave-color-theme.json` |
| `iconThemes` | `risingwave-seti` ("RisingWave Seti Icons") | `file-icons/vs-seti-icon-theme.json`; **opt-in**, user must select it |
| `configurationDefaults` | `[risingwave-sql]` | `editor.wordBasedSuggestions = matchingDocuments`, `editor.suggest.insertMode = replace` |

Not contributed: **commands, keybindings, menus, views, webviews, custom settings, debuggers, tasks, language servers**. The extension has no configuration schema of its own, so there are no user-facing settings to document.

## Programmatic providers (`extension.js`)

| Provider | Registered for | Trigger | Returns |
|---|---|---|---|
| `FileDecorationProvider` | any URI | VS Code asks per file | `{ badge: 'RW', tooltip: 'RisingWave SQL file', color: charts.orange }` when `uri.fsPath` ends with `.rw`, else `null` |
| `HoverProvider` | `risingwave-sql` | Mouse hover | `vscode.Hover` with a trusted, HTML-enabled `MarkdownString`: `### keyword`, description, optional Syntax / Parameters / Example blocks, optional "Documentation" link; `null` if no doc |
| `CompletionItemProvider` | `risingwave-sql` | typing, `'`, `=` | Flat list of connectors, formats, encodings and keywords (see [architecture](architecture.md#completion)) |

`activate(context)` returns nothing: **the extension exports no API object** for other extensions to consume. `deactivate()` only logs.

### Hover markdown shape

Produced by `createHoverContent` in `extension.js` from a `docs` entry ([data model](db/README.md)):

````markdown
### <keyword>

<description>

**Syntax:**
```sql
<syntax>
```

**Parameters:**          (only if present)
```
<parameters>
```

**Example:**             (only if present)
```sql
<example>
```

[📖 Documentation](<docUrl>)
````

## Internal module API (`lib/keywords.js`)

Pure functions with no `vscode` dependency. Not exported to other extensions, but this is the seam the tests use.

| Export | Signature | Behaviour |
|---|---|---|
| `data` | object | The parsed `data/risingwave.json`. |
| `risingwaveKeywordDocs` | `{ [keyword]: { syntax, description, example?, parameters?, docUrl } }` | `data.docs` with `example` / `parameters` line arrays joined by `\n`. |
| `compoundKeywords` | `{ keyword, regex }[]` | Every keyword containing whitespace, `_` or `.`, longest first, as case-insensitive `\b…\b` regexes with `\s+` between words. |
| `findCompoundKeywordAt` | `(lineText: string, character: number) => { keyword, start, end } \| null` | First compound keyword whose span contains `character` (inclusive of the end boundary). |
| `findDoc` | `(word: string) => { keyword, docEntry } \| null` | Case-insensitive lookup in `risingwaveKeywordDocs`. |
| `completionLists` | `{ connectors, formats, encodings, keywords }` | Deduplicated string arrays. |

## Build tooling interface

| Command | Contract |
|---|---|
| `npm run build` | Rewrites generated files; prints `Updated:` / `No changes.` |
| `npm run check` | Exit 0 if generated files are current, exit 1 and list stale files otherwise |
| `npm run lint` | ESLint (`eslint:recommended`, `no-unused-vars` with `args: none`) |
| `npm test` | `node --test test/` |
| `npm run verify` | `check` + `lint` + `test` |
| `npm run package` | `vsce package --no-dependencies --out dist/` (runs `verify` first) |

## If an API is ever added

If a language server or any HTTP surface is introduced, add an `openapi.yaml` under `docs/api/` and link it here. Don't generate one speculatively.
