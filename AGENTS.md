# vscode-risingwave — agent notes

VS Code language extension for `.rw` (RisingWave SQL). Plain CommonJS, no bundler.

## Layout
- `extension.js` — activation; hover, completion, file-badge providers (vscode API only here)
- `lib/keywords.js` — pure logic (docs lookup, compound keyword matching, completion lists); testable without vscode
- `data/risingwave.json` — single source of truth: keyword groups, functions, types, formats, encodings, connectors, hover docs
- `scripts/build.js` — regenerates grammar regexes (`"comment": "generated:<id>"` patterns) and `<!-- GEN:* -->` sections in `README.md` / `.github/skills/risingwave-sql/SKILL.md`
- `syntaxes/`, `snippets/`, `themes/`, `file-icons/`, `icons/` — contributed assets

## Workflow
- Edit `data/risingwave.json` or `snippets/*.json`, then `npm run build`. Never hand-edit between GEN markers or generated grammar `match`/`begin` lines.
- `npm run verify` before commit/PR (check + lint + test). Also runs on `vscode:prepublish`.
- `npm run package` builds the vsix into `dist/` (gitignored). Do not commit `.vsix` files.
- Releases: follow `RELEASING.md`. Don't bump the version unless asked.

## Tests
- `node --test test/` via `npm test`. Grammar tests tokenize with `vscode-textmate` + `vscode-oniguruma`; add a case there for any highlighting change.
