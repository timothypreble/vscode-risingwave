# Releasing

How to cut a release of the RisingWave SQL extension. Example below uses `0.2.0` → `0.3.0`.

Distribution is a `.vsix` file installed via "Extensions: Install from VSIX...". Versions follow [SemVer](https://semver.org/); the changelog follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 1. Pre-flight

```bash
git status            # working tree must be clean, on dev
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
npm run package       # runs verify via vscode:prepublish, writes dist/risingwave-sql-0.3.0.vsix
```

Install it in a clean VS Code window (`Ctrl/Cmd+Shift+P` → "Extensions: Install from VSIX..."), open a `.rw` file, and check:

- Syntax highlighting (keywords, `connector = '...'` values, `WITH ( ... )` option keys)
- Hover docs on a compound keyword (e.g. `CREATE MATERIALIZED VIEW`)
- Completion and snippets (e.g. `sourcekafka`)
- Orange `RW` file badge

Optionally inspect the package contents:

```bash
unzip -l dist/risingwave-sql-0.3.0.vsix
```

## 6. Commit and open a release PR

```bash
git add package.json package-lock.json CHANGELOG.md
git commit -m "Release 0.3.0"
git push
```

Open a PR from `dev` to `main`. The `ci` check must pass. **Don't tag by hand**: merging the PR runs `.github/workflows/release.yml`, which tags `v0.3.0`, creates the GitHub Release, uses the matching `CHANGELOG.md` section as notes, and attaches `risingwave-sql-0.3.0.vsix`. If `v0.3.0` already exists, the merge only verifies and publishes nothing, so bump the version first.

## 7. Distribute

Download `risingwave-sql-0.3.0.vsix` from the GitHub Release and share it. **Never commit `.vsix` files**; they're gitignored.

## Automation

| Event | Workflow | Result |
| --- | --- | --- |
| PR to `main` or `dev` | `ci.yml` | `npm run package` (includes verify); vsix uploaded as a workflow artifact |
| Push to `dev` | `release.yml` | Rolling `dev` pre-release with `risingwave-sql-<version>-dev.<sha>.vsix`, replaced on every push |
| Push to `main`, version not yet tagged | `release.yml` | Tag `vX.Y.Z` plus GitHub Release with the vsix |
| Push to `main`, version already tagged | `release.yml` | Build and verify only |

No secrets are needed; the workflows use the built-in `GITHUB_TOKEN`.

### Dev builds

Every push to `dev` refreshes the `dev` pre-release on the repo's GitHub Releases page. Install its vsix to try unreleased changes. The version inside it is the current `package.json` version, so don't treat it as a stable release.

### One-time GitHub setup

- Push `main` and `dev` to `origin`.
- Protect `main` (Settings > Branches or Rulesets): require a PR and require the `ci` check.
- Settings > Actions > General: workflow permissions must allow `contents: write`.

## Checklist

- [ ] Tree clean, `npm ci`, `npm run verify` passes
- [ ] `npm version X.Y.Z --no-git-tag-version`
- [ ] `CHANGELOG.md`: `[Unreleased]` → `[X.Y.Z] - YYYY-MM-DD`, new empty `[Unreleased]` added
- [ ] `npm run package` succeeds; vsix smoke-tested
- [ ] Commit `Release X.Y.Z`, push, open `dev` → `main` PR
- [ ] PR merged; GitHub Release `vX.Y.Z` has the vsix attached
