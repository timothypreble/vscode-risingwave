#!/usr/bin/env node
// Regenerates derived artifacts from data/risingwave.json and snippets/*.json:
//   - RisingWave pattern regexes in syntaxes/risingwave.tmLanguage.json
//   - <!-- GEN:* START/END --> sections in README.md and .github/skills/risingwave-sql/SKILL.md
//
// Usage:
//   node scripts/build.js          write files
//   node scripts/build.js --check  exit 1 if any file is out of date (no writes)

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const readJson = (p) => JSON.parse(read(p));

const data = readJson('data/risingwave.json');
const rwSnippets = readJson('snippets/risingwave.json');
const pgSnippets = { ...readJson('snippets/postgres.json'), ...readJson('snippets/misc.json') };

// ---------- helpers ----------

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const uniq = (arr) => [...new Set(arr)];
const code = (s) => `\`${s}\``;

// Build a case-insensitive alternation; multi-word entries tolerate any whitespace.
function toAlt(list) {
  const alts = uniq(list)
    .sort((a, b) => b.length - a.length)
    .map((k) => escapeRegex(k).split(' ').join('\\s+'));
  return `(?i)\\b(${alts.join('|')})\\b`;
}

function replaceSection(text, name, body, file) {
  const re = new RegExp(`(<!-- GEN:${name} START -->)[\\s\\S]*?(<!-- GEN:${name} END -->)`);
  if (!re.test(text)) throw new Error(`${file}: missing marker pair GEN:${name}`);
  return text.replace(re, `$1\n${body}\n$2`);
}

function table(headers, rows) {
  return [
    `| ${headers.join(' | ')} |`,
    `|${headers.map(() => '---').join('|')}|`,
    ...rows.map((r) => `| ${r.join(' | ')} |`)
  ].join('\n');
}

const firstPrefix = (s) => (Array.isArray(s.prefix) ? s.prefix[0] : s.prefix);
const rwPrefixes = new Set(Object.values(rwSnippets).filter((s) => s.prefix).map(firstPrefix));

// ---------- grammar ----------

// Bare alternation without the (?i)\b wrapper, for embedding in capture-group regexes.
function alt(list) {
  return uniq(list).sort((a, b) => b.length - a.length).map((k) => escapeRegex(k).split(' ').join('\\s+')).join('|');
}

const connectorNames = uniq([...data.connectors.sources, ...data.connectors.sinks].map((c) => c.name));

// Each key matches a `"comment": "generated:<key> ..."` pattern in the grammar; its "match"/"begin" is replaced.
const grammarRegexes = {
  ddl: toAlt(data.keywords.ddl),
  streaming: toAlt(data.keywords.streaming),
  window: toAlt(data.keywords.window),
  admin: toAlt(data.keywords.admin),
  functions: toAlt(data.functions),
  types: toAlt(data.types),
  'format-keywords': toAlt(data.keywords.format),
  format: `(?i)\\b(FORMAT)\\s+(${alt(data.formats)})\\b`,
  encode: `(?i)\\b(ENCODE)\\s+(${alt(data.encodings)})\\b`,
  'encode-options': `(?i)\\b(ENCODE)\\s+(${alt(data.encodings)})\\s*(\\()`,
  option: `(?i)\\b(${alt(data.keywords.option)})\\b(?=\\s*=)`,
  'connector-value': `(?i)\\b(connector)\\s*(=)\\s*(')(${alt(connectorNames)})(')`
};

// Text-level replacement so the rest of the grammar keeps its hand formatting.
function buildGrammar() {
  let text = read('syntaxes/risingwave.tmLanguage.json');
  for (const [id, regex] of Object.entries(grammarRegexes)) {
    const re = new RegExp(`("comment": "generated:${escapeRegex(id)}(?: [^"]*)?",\\s*\\n(?:\\s*"name": "[^"]*",\\s*\\n)?\\s*"(?:match|begin)": )"[^"]*"`);
    if (!re.test(text)) throw new Error(`grammar: no pattern with comment "generated:${id}"`);
    text = text.replace(re, `$1${JSON.stringify(regex)}`);
  }
  const leftover = text.match(/"comment": "generated:([\w-]+)/g) || [];
  for (const m of leftover) {
    const id = m.replace('"comment": "generated:', '');
    if (!(id in grammarRegexes)) throw new Error(`grammar: pattern "generated:${id}" has no generator`);
  }
  JSON.parse(text);
  return text;
}

// ---------- doc fragments ----------

function snippetTable(snippets, { sections }) {
  const rows = [];
  for (const [title, s] of Object.entries(snippets)) {
    if (!s.prefix) {
      if (sections) rows.push([`**${title.replace(/^-- | --$/g, '').replace(/\w\S*/g, (w) => w[0] + w.slice(1).toLowerCase())}**`, '']);
      continue;
    }
    rows.push([code(firstPrefix(s)), s.description || '']);
  }
  return table(['Prefix', 'Description'], rows);
}

function connectorTable(list) {
  for (const c of list) {
    if (c.snippet && !rwPrefixes.has(c.snippet)) throw new Error(`connector ${c.label}: snippet prefix "${c.snippet}" not found in snippets/risingwave.json`);
  }
  return table(['Connector', 'Type', 'Snippet'], list.map((c) => [c.label, c.type, c.snippet ? code(c.snippet) : '—']));
}

function highlightList() {
  const connectorNames = uniq([...data.connectors.sources, ...data.connectors.sinks].map((c) => c.name));
  const line = (label, items) => `- **${label}**: ${items.map(code).join(', ')}`;
  return [
    line('RisingWave DDL', data.keywords.ddl),
    line('Streaming', data.keywords.streaming),
    line('Windows', data.keywords.window),
    line('Admin', data.keywords.admin),
    line('Connectors', connectorNames),
    line('Formats', data.formats),
    line('Encodings', data.encodings),
    line('Types', data.types)
  ].join('\n');
}

function hoverList() {
  const connectorNames = new Set([...data.connectors.sources, ...data.connectors.sinks].map((c) => c.name));
  const keys = Object.keys(data.docs);
  const keywords = keys.filter((k) => !connectorNames.has(k));
  const connectors = keys.filter((k) => connectorNames.has(k));
  return [
    `- ${keywords.map(code).join(', ')}`,
    `- Connector names: ${connectors.map(code).join(', ')}`
  ].join('\n');
}

function buildReadme() {
  let text = read('README.md');
  text = replaceSection(text, 'highlight', highlightList(), 'README.md');
  text = replaceSection(text, 'hover', hoverList(), 'README.md');
  text = replaceSection(text, 'snippets-rw', snippetTable(rwSnippets, { sections: true }), 'README.md');
  text = replaceSection(text, 'snippets-pg', snippetTable(pgSnippets, { sections: false }), 'README.md');
  text = replaceSection(text, 'connectors-sources', connectorTable(data.connectors.sources), 'README.md');
  text = replaceSection(text, 'connectors-sinks', connectorTable(data.connectors.sinks), 'README.md');
  return text;
}

function buildSkill() {
  const file = '.github/skills/risingwave-sql/SKILL.md';
  return replaceSection(read(file), 'snippets', snippetTable(rwSnippets, { sections: false }), file);
}

// ---------- main ----------

const outputs = {
  'syntaxes/risingwave.tmLanguage.json': buildGrammar,
  'README.md': buildReadme,
  '.github/skills/risingwave-sql/SKILL.md': buildSkill
};

const check = process.argv.includes('--check');
const stale = [];
for (const [file, build] of Object.entries(outputs)) {
  const next = build();
  if (next === read(file)) continue;
  stale.push(file);
  if (!check) fs.writeFileSync(path.join(root, file), next);
}

if (check) {
  if (stale.length) {
    console.error('Out of date (run `npm run build`):\n  ' + stale.join('\n  '));
    process.exit(1);
  }
  console.log('All generated files up to date.');
} else {
  console.log(stale.length ? 'Updated:\n  ' + stale.join('\n  ') : 'No changes.');
}
