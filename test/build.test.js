// Generated files (grammar regexes, README/SKILL tables) must match data/risingwave.json and snippets/*.json.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

test('generated files are up to date (npm run check)', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'scripts', 'build.js'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
});

test('package.json contributions point at existing files', () => {
  const fs = require('node:fs');
  const root = path.join(__dirname, '..');
  const pkg = require('../package.json');
  const paths = [
    pkg.main,
    pkg.icon,
    ...pkg.contributes.languages.map(l => l.configuration),
    ...pkg.contributes.languages.flatMap(l => Object.values(l.icon || {})),
    ...pkg.contributes.grammars.map(g => g.path),
    ...pkg.contributes.snippets.map(s => s.path),
    ...pkg.contributes.themes.map(t => t.path),
    ...pkg.contributes.iconThemes.map(t => t.path)
  ];
  for (const p of paths) assert.ok(fs.existsSync(path.join(root, p)), `missing ${p}`);
});
