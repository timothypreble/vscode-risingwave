# Changelog

All notable changes to the RisingWave SQL extension are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow [SemVer](https://semver.org/).

## [Unreleased]

### Added
- `data/risingwave.json` as the single source of truth for keywords, connectors, formats, encodings, and hover docs. `extension.js` reads it at runtime; `npm run build` regenerates the grammar regexes and the marked tables in `README.md` and `SKILL.md`; `npm run check` fails if they drift.
- Connector names are highlighted inside `connector = '...'` values; option keys (`topic`, `properties.bootstrap.server`, ...) get their own scope inside `WITH ( ... )` and `ENCODE <x> ( ... )` blocks.
- Hover range now covers the whole compound keyword (e.g. all of `CREATE MATERIALIZED VIEW`).
- Completion offers every known connector (previously a 12-item subset).
- Test suite (`npm test`): keyword/hover logic, real TextMate tokenization of the grammar, generated-file drift, and `package.json` contribution paths. ESLint config (`npm run lint`). `npm run verify` runs all three and is wired to `vscode:prepublish`.
- `.gitignore`; `.vscodeignore` now excludes tooling, notes, and build artifacts from the package.

### Changed
- `type`, `connector`, `primary_key`, `snapshot.*` are only highlighted as RisingWave options inside option blocks, not globally.
- `JSON`, `AVRO`, `PLAIN`, ... are only highlighted as format/encoding values after `FORMAT` / `ENCODE`; bare `JSON` is a PostgreSQL type again.
- RisingWave function scope now contains only `proctime`; `LAG`, `LEAD`, `NOW`, `array_agg`, ... are PostgreSQL functions.
- README snippet/connector tables are generated from `snippets/*.json` and now list every snippet and connector.

### Fixed
- Hover matched a compound keyword anywhere earlier on the line (e.g. hovering `my_src` in `CREATE SOURCE my_src` showed the `CREATE SOURCE` doc). Now only matches when the cursor is inside the keyword.
- Hover on `WATERMARK FOR` never showed the `WATERMARK` doc.
- Compound keywords separated by multiple spaces or tabs were not recognized by hover.

### Removed
- Committed `.vsix` artifacts (now gitignored; attach to releases instead).
- Unreferenced `file-icons/risingwave-icon-theme.json`, `file-icons/risingwave-seti-icon-theme.json`, `icons/file.svg`, `icons/folder.svg`, `icons/folder-open.svg`.

## [0.2.0] - 2026-03-24

- Hover documentation and completion provider.
- Orange `RW` file badge, custom `.rw` icon in a Seti-based icon theme.
- PostgreSQL + RisingWave grammar, snippets, and dark theme.

## [0.1.4] and earlier

- Initial grammar, snippets, icon, and theme iterations.
