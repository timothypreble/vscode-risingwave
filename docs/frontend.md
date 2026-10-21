# Frontend, UI and theming

**There is no web frontend**: no React/Vue/webview, no component library, no CSS, no build step for UI. The "frontend" of this extension is the set of surfaces VS Code renders on its behalf. There are no CSS design tokens either; the equivalent tokens are TextMate **scopes** mapped to **hex colours** in a VS Code colour theme.

See also: [architecture](architecture.md) · [API surface](api.md) · [features](features.md)

## UI surfaces

| Surface | Mechanism | Defined in | Themed by |
|---|---|---|---|
| Syntax colours | TextMate grammar scopes | `syntaxes/risingwave.tmLanguage.json` | Active colour theme (or the bundled **RisingWave Theme**) |
| Hover card | `vscode.Hover` + `MarkdownString` | `extension.js` `createHoverContent` | VS Code's hover widget; fully host-styled |
| Completion list | `CompletionItem` (`Constant` / `Keyword` kinds) | `extension.js` | Host-styled; icon comes from `CompletionItemKind` |
| Explorer badge | `FileDecoration` (`RW`, `charts.orange`) | `extension.js` | Uses the **theme colour id** `charts.orange`, so it follows the user's theme |
| File icon | Icon theme | `file-icons/vs-seti-icon-theme.json`, `icons/rw.svg` | Opt-in; falls back to Seti for every other file type |
| Snippets | Snippet engine | `snippets/*.json` | Host-styled |
| Editor behaviour | Language configuration | `language-configuration.json` | n/a |

No custom fonts are applied by the extension (the icon theme ships `file-icons/seti.woff` for Seti glyphs only).

## Colour theme: "RisingWave Theme"

Type `vs-dark`, file `themes/risingwave-color-theme.json`. It deliberately overrides only **4 UI colours** and a set of token colours, so it looks like Dark+ with an orange accent.

### UI colour keys

| Key | Value | Purpose |
|---|---|---|
| `editor.background` | `#1e1e1e` | Matches VS Code Dark+ |
| `editor.foreground` | `#d4d4d4` | Matches VS Code Dark+ |
| `activityBarBadge.background` | `#ff8800` | Brand orange on notification badges |
| `sideBarTitle.foreground` | `#bbbbbb` | Muted sidebar titles |

### Token colour rules (design tokens)

Contrast is WCAG contrast ratio against `#1e1e1e` (AA for normal text needs 4.5:1).

| Token group | Scopes | Colour | Style | Contrast |
|---|---|---|---|---|
| RisingWave keywords (DDL, streaming, window, format, admin, option) | `keyword.control.risingwave.{ddl,streaming,window,format,admin,option}` | `#FF8800` | bold | 7.0 |
| RisingWave functions | `support.function.risingwave` | `#FFAA33` | italic | 8.8 |
| Connector names, format/encoding values | `constant.language.risingwave.{connector,format}` | `#FF6600` | bold | 5.7 |
| Option keys | `variable.parameter.risingwave.option` | `#9CDCFE` | | 11.2 |
| RisingWave types | `storage.type.risingwave` | `#FFCC66` | | 11.2 |
| PostgreSQL keywords | `keyword.other.postgresql.{dml,ddl,transaction}` | `#569CD6` | | 5.7 |
| PostgreSQL types | `storage.type.postgresql` | `#4EC9B0` | | 8.2 |
| PostgreSQL functions | `support.function.postgresql.{aggregate,string,datetime,json,window}` | `#DCDCAA` | | 11.8 |
| Strings | `string.quoted.{single,double,dollar}.sql` | `#CE9178` | | 6.3 |
| Numbers | `constant.numeric.sql` | `#B5CEA8` | | 9.8 |
| Comments | `comment.{line.double-dash,block}.sql` | `#6A9955` | italic | 5.0 |
| Operators | `keyword.operator.{comparison,arithmetic,json,assignment}.sql` | `#D4D4D4` | | 11.2 |

All token colours pass AA on the theme's own background.

### Theming rules

1. **Orange means RisingWave-specific; blue/teal/yellow means PostgreSQL.** Anything the grammar attributes to RisingWave uses the `risingwave` scope segment and an orange-family colour (or `#9CDCFE` / `#FFCC66` for options and types). Everything standard keeps Dark+ colours.
2. **Scope naming**: `<category>.<subcategory>.<dialect>.<role>`, where dialect is `risingwave` or `postgresql`. New RisingWave scopes must follow this so the theme (and third-party themes) can target them with a prefix match.
3. **Theme-agnostic by design.** The grammar emits standard TextMate categories (`keyword.control`, `support.function`, `storage.type`, `constant.language`), so any theme highlights `.rw` files sensibly; the bundled theme only adds the orange distinction.
4. **Every new scope needs a theme rule.** Currently unthemed (fall back to the editor foreground): `variable.other.sql` (identifiers), `constant.character.escape.sql`.
5. **Colours in extension code must be theme colour ids**, not hex, e.g. `new vscode.ThemeColor('charts.orange')` for the badge.

### Scope → source map

| Scope prefix | Emitted by grammar pattern |
|---|---|
| `keyword.control.risingwave.ddl` / `.streaming` / `.window` / `.admin` / `.format` | `risingwave-keywords` (generated from `data.keywords.*`) |
| `keyword.control.risingwave.option`, `variable.parameter.risingwave.option` | `risingwave-option-body` (only inside `WITH ( )` / `ENCODE x ( )`) |
| `constant.language.risingwave.connector` | `connector = '<name>'` inside option blocks |
| `constant.language.risingwave.format` | `FORMAT <x>` / `ENCODE <x>` |
| `support.function.risingwave` | `risingwave-functions` (`proctime`) |
| `storage.type.risingwave` | `risingwave-types` |
| `keyword.other.postgresql.*`, `support.function.postgresql.*`, `storage.type.postgresql` | hand-written PostgreSQL patterns |

To inspect a token live in VS Code run **Developer: Inspect Editor Tokens and Scopes**.

## Brand assets

| Asset | Path | Notes |
|---|---|---|
| Extension icon | `icons/rw-icon.png` | 33×31 px PNG. The Marketplace recommends 128×128; fine for sideloaded `.vsix`, would be blurry if ever published. |
| File icon | `icons/rw.svg` | 64×64, `#1E1E1E` rounded square, orange wave and "RW" text (`#FF8800`). Used for both light and dark. |
| Icon theme | `file-icons/vs-seti-icon-theme.json` | Seti theme with `rw` extension and `risingwave-sql` language id mapped to `_rw`; `_rw_light` variant points at the same SVG. |

The icon theme, not the language `icon`, drives explorer icons. Users must choose **File Icon Theme → RisingWave Seti Icons**. The orange `RW` badge is independent of the icon theme.

## Hover card layout

Content is assembled from the doc entry in this order: title (`###`), description, **Syntax** (sql block), **Parameters** (plain block, connector docs), **Example** (sql block), documentation link. `isTrusted` and `supportHtml` are enabled on the `MarkdownString`, although the content is repo-controlled data with no command links or HTML. See [audit findings](audit.md#extensionjs).
