# RisingWave SQL for VS Code

This extension adds full support for `.rw` files in Visual Studio Code:

- Syntax highlighting for RisingWave-specific SQL constructs
- Optional RisingWave dark theme with orange keywords
- Rich code snippets for RisingWave, Postgres, and file headers
- File decorations (RW badge) in the explorer for easy identification

## Features Summary

- **Syntax Highlighting:** Recognizes RisingWave SQL keywords and constructs
- **Theme:** "RisingWave Theme" for a dark UI with orange highlights
- **Snippets:** Quickly insert RisingWave, Postgres, and file header templates
- **File Decorations:** Orange RW badge and tooltip for `.rw` files (works with any icon theme)

---

## Snippet Usage

This extension provides code snippets for:

- **RisingWave SQL:** Materialized views, sources, ASOF joins, window aggregations, sinks, and more
- **Postgres SQL:** Table creation, inserts, upserts, indexes, foreign keys, functions, window functions
- **File Header:** Standard header block for SQL scripts

**How to use:**

1. Open a `.rw` or `.sql` file
2. Type a snippet prefix (e.g., `mv`, `sourcekafka`, `table`, `header`)
3. Select the snippet from the suggestion list

**Example Snippet Prefixes:**

- `mv` → Create Materialized View
- `sourcekafka` → Create Kafka Source
- `asof` → ASOF Join
- `tumble` / `hop` → Window Aggregation
- `sinkpg` → Create Postgres Sink
- `table` → Create Table (Postgres)
- `header` → File Header block

---

## File Icons

Your extension includes a complete icon theme called "RisingWave Seti Icons" based on VS Code's Seti theme, with your custom `.rw` icon included.

**How to enable:**
1. Open command palette (`Ctrl+Shift+P`)
2. Search for "File Icon Theme"  
3. Select **RisingWave Seti Icons**

This provides:
- ✅ Your custom `.rw` file icon (SVG)
- ✅ All standard file type icons (JS, JSON, HTML, CSS, Python, etc.)
- ✅ Familiar Seti icon style
- ✅ No missing icons

**Icon Theme Credits:**
- Base theme: [Seti UI](https://github.com/jesseweed/seti-ui) by Jesse Weed
- VS Code integration: [Microsoft VS Code Seti Theme](https://github.com/microsoft/vscode/tree/main/extensions/theme-seti)
- Custom `.rw` icon: USXpress RisingWave team

**Alternative:** You can also use any other icon theme you prefer - your `.rw` files will still get the orange "RW" badge for identification.

---

## File Decorations

All `.rw` files show an orange "RW" badge in the explorer, with a tooltip "RisingWave SQL file".

This helps visually distinguish RisingWave SQL files from others and works with any icon theme.

---

## Usage

1. Install the extension (`.vsix`)
2. Open any `.rw` file
3. Switch to **RisingWave Theme** from the command palette (`Ctrl+Shift+P` → "Color Theme")

---

## Build
1. Install VSCE
```bash
npm install -g vsce
```

2. Package the extension
```shell
cd vscode-risingwave
vsce package
```

3. Install in VS Code:
* Open VS Code
* Press Ctrl+Shift+P → Extensions: Install from VSIX...
* Select risingwave-sql-0.X.X.vsix

4. View RW File
Open .rw files → syntax highlighting, snippets, icons, and theme available.