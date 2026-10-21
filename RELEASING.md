# Releasing

How to cut a release of the RisingWave SQL extension. Example below uses `0.2.0` → `0.3.0`.

Distribution is a `.vsix` file installed via "Extensions: Install from VSIX...". Versions follow [SemVer](https://semver.org/); the changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 1. Pre-flight

```bash
git status            # working tree must be clean, on main
npm ci                # install exact locked deps
npm run verify        # check + lint + test
```

Fix anything that fails before continuing.

## 2. Pick the version

While below 1.0:

- **Minor** (`0.2.0` → `0.3.0`): new features, highlighting/hover behavior changes, removed assets.
- **Patch** (`0.3.0` → `0.3.1`): bug fixes only.

Read `## [Unreleased]` in `CHANGELOG.md` to decide. If it's empty, there's nothing to release.

## 3. Bump the version

```bash
npm version 0.3.0 --no-git-tag-version
```

This updates `package.json` and `package-lock.json` together. Don't edit them by hand. `--no-git-tag-version` stops npm from committing and tagging, so you can update the changelog in the same commit.

## 4. Update `CHANGELOG.md`

Rename the `Unreleased` heading to the new version with today's date, then add a new empty `Unreleased` section above it:

```markdown
## [Unreleased]

## [0.3.0] - 2026-10-14

### Added
...
```

Read through the entries once more. Each one should describe a change users can see.

## 5. Build and smoke-test

```bash
npm run package       # runs verify via vscode:prepublish, writes risingwave-sql-0.3.0.vsix
```

Install it in a clean VS Code window (`Ctrl/Cmd+Shift+P` → "Extensions: Install from VSIX..."), open a `.rw` file, and check:

- Syntax highlighting (keywords, `connector = '...'` values, `WITH ( ... )` option keys)
- Hover docs on a compound keyword (e.g. `CREATE MATERIALIZED VIEW`)
- Completion and snippets (e.g. `sourcekafka`)
- Orange `RW` file badge

Optionally inspect the package contents:

```bash
unzip -l risingwave-sql-0.3.0.vsix
```

## 6. Commit and tag

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "Release 0.3.0"
git tag -a v0.3.0 -m "v0.3.0"
git push && git push origin v0.3.0    # once a remote is configured
```

## 7. Distribute

Attach `risingwave-sql-0.3.0.vsix` to the release (or share it internally). **Never commit `.vsix` files**; they're gitignored.

## Checklist

- [ ] Tree clean, `npm ci`, `npm run verify` passes
- [ ] `npm version X.Y.Z --no-git-tag-version`
- [ ] `CHANGELOG.md`: `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`, new empty `[Unreleased]` added
- [ ] `npm run package` succeeds; vsix smoke-tested
- [ ] Commit `Release X.Y.Z`, tag `vX.Y.Z`, push
- [ ] vsix attached / distributed
