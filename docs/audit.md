# Audit findings

Point-in-time audit of the repo at version `0.2.0` + `[Unreleased]`, branch `f/init`. Documentation was written from the code; where docs and code disagreed, the code won and the discrepancy is listed here. **No source code behaviour was changed** by the audit.

Baseline: `npm run verify` passes (build check, ESLint, 16/16 tests at audit time; 17/17 after the R1/E1 fixes).

See also: [architecture](architecture.md) · [features](features.md)

## Applicability of the requested documentation

| Requested | Status | Why |
|---|---|---|
| README overhaul | Done | [README.md](../README.md) |
| Backend & architecture | Done | [architecture.md](architecture.md). There is no backend; the "services" are three VS Code providers plus a build script |
| Database schema / ERDs in `docs/db/` | Done as **data model** | [db/README.md](db/README.md). There is no database; the JSON data files are diagrammed instead |
| OpenAPI v3 spec | **Not applicable** | No HTTP API exists. [api.md](api.md) documents the extension contribution contract instead |
| Frontend stack | Done as **UI & theming** | [frontend.md](frontend.md). No web frontend or component library; design tokens are TextMate scopes → hex colours |
| User flows (signup → power user) | Done, adapted | [user-flows.md](user-flows.md). No signup/accounts; install → first use → power paths, plus contributor and release flows |
| Core functionality checklists | Done | [features.md](features.md) |

## Findings

Severity: **fix** = recommended before the next release, **consider** = judgement call, **info** = noted only.

### Repository

| # | Sev | Finding | Evidence | Suggested action |
|---|---|---|---|---|
| R1 | ~~fix~~ **Fixed** | CHANGELOG `[Unreleased] → Removed` says five files were deleted, but they are still tracked, unreferenced, and **shipped in the vsix** | `git ls-files` lists `file-icons/risingwave-icon-theme.json`, `file-icons/risingwave-seti-icon-theme.json`, `icons/file.svg`, `icons/folder.svg`, `icons/folder-open.svg`; `rg` finds them only in `CHANGELOG.md`; `vsce ls` includes them | Removed with `git rm`; the changelog is now accurate |
| R2 | fix | Release docs and workflows assume a `dev` branch that does not exist on `origin` | `git branch -a` shows only `main` and `f/init`; `RELEASING.md` and `release.yml` reference `dev` | Create `dev`, or update `RELEASING.md`, `ci.yml`, `release.yml` and the install notes to the real branching model |
| R3 | consider | `README.md` has an uncommitted edit removing the link to the Releases page | `git diff README.md` | Left as-is during the overhaul (the link is not reintroduced). Confirm it was intentional (e.g. private repo) |
| R4 | consider | `package.json` has no `license` field though `LICENSE` (MIT) exists; no `bugs`/`homepage` | `package.json` | Add `"license": "MIT"` |
| R5 | consider | Extension icon is 33×31 px | `icons/rw-icon.png` | Replace with ≥128×128 if the extension is ever published to a marketplace |
| R6 | info | `activationEvents` entry is redundant on VS Code ≥ 1.74 (contributed languages auto-activate) but required for the declared `^1.70.0` floor | `package.json` | Keep unless the engine floor is raised |
| R7 | info | `docs/` and `plans/` were not excluded from the vsix | `vsce ls` | **Fixed**: added to `.vscodeignore` |

### `extension.js`

| # | Sev | Finding | Evidence | Suggested action |
|---|---|---|---|---|
| E1 | ~~fix~~ **Fixed** | `ASOF LEFT JOIN` and `TEMPORAL JOIN` hovers show nothing. `findCompoundKeywordAt` returns only the longest match, and it has no doc entry; the shorter `ASOF JOIN` is never tried. `ASOF` alone has no doc either | Verified with `findCompoundKeywordAt` / `findDoc` | Added `docs` entries for both, plus a regression test. Hover still does not fall back to a shorter compound, so new compound keywords need their own entry |
| E2 | consider | Completion is context-free: connectors, formats and keywords are offered everywhere, e.g. outside `WITH ( )` | `provideCompletionItems` ignores `document`/`position` | Use a regex/position check to scope connector and option suggestions |
| E3 | consider | Hover `MarkdownString` sets `isTrusted = true` and `supportHtml = true` though content is static, repo-controlled data with no command URIs or HTML | `createHoverContent` | Drop both flags; markdown links still work |
| E4 | consider | `console.log` on activate/deactivate adds noise to the extension host log | `activate`, `deactivate` | Remove, or use an `OutputChannel` if diagnostics are wanted |
| E5 | consider | `extension.js` has no automated tests; only `lib/keywords.js` is covered | `test/` | Keep logic in `lib/`; optionally add `@vscode/test-electron` smoke test |
| E6 | info | Hover word regex allows hyphens (`[a-zA-Z_][a-zA-Z0-9_-]*`) so `postgres-cdc` resolves, but arithmetic like `a-b` is treated as one word. Harmless because lookup just misses | `getWordAtPosition` | none |

### Code conventions (against `.cursor/rules/val.mdc`)

| # | Sev | Finding | Suggested action |
|---|---|---|---|
| C1 | consider | "Docstrings on every public symbol": `extension.js` (`activate`, `deactivate`) and every export of `lib/keywords.js` have none | Add JSDoc; [api.md](api.md) already documents the signatures |
| C2 | consider | DRY: `escapeRegex` and the "multi-word → `\s+` alternation" logic exist in both `lib/keywords.js` and `scripts/build.js` | Extract to a shared module required by both |
| C3 | info | Rule upkeep: only `val.mdc` existed in `.cursor/rules/`; no `.cursorrules` legacy file found | **Fixed**: added `architecture.mdc` |

### Grammar and theme

| # | Sev | Finding | Suggested action |
|---|---|---|---|
| G1 | consider | Scopes `variable.other.sql` and `constant.character.escape.sql` have no rule in the bundled theme | Add rules or accept editor-foreground fallback |
| G2 | consider | Bundled theme is `vs-dark` only | Add a light variant if there is demand |
| G3 | info | Grammar and data model disagree on `functions`: only `proctime` is RisingWave-specific. Other functions are PostgreSQL by design (documented in CHANGELOG) | none |

### Docs drift (fixed in the README overhaul)

| # | Finding |
|---|---|
| D1 | README feature table said completion covers "Connectors, formats"; it also offers encodings, window/streaming keywords and functions |
| D2 | README had no architecture, data-model or contributor pointers; now links to `docs/` |

## Known limitations

Carried from the backlog and confirmed in code:

- Hover does not match compound keywords split across lines (`EMIT ON` / `WINDOW CLOSE`). Matching is per line (`findCompoundKeywordAt(lineText, …)`).
- Only 26 keywords/connectors have hover docs. Still undocumented: admin commands, `EMIT ON UPDATE`/`EMIT IMMEDIATELY`, `INCLUDE PARTITION/OFFSET/HEADER`, most connectors.
- Connector `label`/`type` values for newer connectors (Kinesis, Iceberg, Redis, …) were assigned without checking against RisingWave docs.
- `TYPE` is in the PostgreSQL DDL keyword list, so a column or identifier named `type` outside option blocks is highlighted as a keyword.
- No snippets for 17 of the 29 listed connectors (12 have one).
