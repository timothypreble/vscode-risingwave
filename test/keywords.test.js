const { test } = require('node:test');
const assert = require('node:assert/strict');
const { data, risingwaveKeywordDocs, compoundKeywords, findCompoundKeywordAt, findDoc, completionLists } = require('../lib/keywords');

test('findCompoundKeywordAt only matches when the cursor is inside the keyword span', () => {
  const cases = [
    ['CREATE SOURCE my_src (', 16, null],
    ['CREATE SOURCE my_src (', 2, 'CREATE SOURCE'],
    ['CREATE SOURCE my_src (', 13, 'CREATE SOURCE'],
    ['CREATE  MATERIALIZED   VIEW x', 10, 'CREATE MATERIALIZED VIEW'],
    ['GROUP BY TUMBLE(ts) EMIT ON WINDOW CLOSE;', 11, null],
    ['GROUP BY TUMBLE(ts) EMIT ON WINDOW CLOSE;', 35, 'EMIT ON WINDOW CLOSE'],
    ['t ASOF LEFT JOIN q', 8, 'ASOF LEFT JOIN'],
    ['t ASOF JOIN q', 8, 'ASOF JOIN'],
    ['create sink s from mv', 8, 'CREATE SINK'],
    ['SELECT TUMBLE_START(ts, x)', 10, 'TUMBLE_START'],
    ['  snapshot.interval = 5', 6, 'snapshot.interval'],
    ['  snapshotXinterval', 6, null],
    ['foo WATERMARK FOR ts', 1, null]
  ];
  for (const [line, ch, expected] of cases) {
    const r = findCompoundKeywordAt(line, ch);
    assert.equal(r && r.keyword, expected, JSON.stringify([line, ch]));
  }
});

test('compound keywords are sorted longest-first', () => {
  const lengths = compoundKeywords.map(c => c.keyword.length);
  assert.deepEqual(lengths, [...lengths].sort((a, b) => b - a));
});

test('findDoc is case-insensitive and falls through for compound keywords without docs', () => {
  assert.equal(findDoc('tumble').keyword, 'TUMBLE');
  assert.equal(findDoc('Kafka').keyword, 'kafka');
  assert.equal(findDoc('WATERMARK FOR'), null);
  assert.equal(findDoc('watermark').keyword, 'WATERMARK');
});

test('docs: multi-line fields are joined and every entry has description + docUrl', () => {
  for (const [keyword, entry] of Object.entries(risingwaveKeywordDocs)) {
    assert.ok(entry.description, `${keyword}: description`);
    assert.match(entry.docUrl, /^https:\/\/docs\.risingwave\.com\//, `${keyword}: docUrl`);
    if (entry.example) assert.equal(typeof entry.example, 'string');
    if (entry.parameters) assert.equal(typeof entry.parameters, 'string');
  }
});

test('data: every documented keyword exists in some data list', () => {
  const known = new Set([
    ...Object.values(data.keywords).flat(),
    ...data.functions,
    ...data.types,
    ...data.formats,
    ...data.encodings,
    ...completionLists.connectors,
    'WATERMARK' // compound form is WATERMARK FOR; hover falls back to the single word
  ].map(k => k.toUpperCase()));
  for (const keyword of Object.keys(data.docs)) {
    assert.ok(known.has(keyword.toUpperCase()), `doc entry "${keyword}" has no matching keyword/connector`);
  }
});

test('data: connector snippet references exist', () => {
  const snippets = require('../snippets/risingwave.json');
  const prefixes = new Set(Object.values(snippets).filter(s => s.prefix).map(s => (Array.isArray(s.prefix) ? s.prefix[0] : s.prefix)));
  for (const c of [...data.connectors.sources, ...data.connectors.sinks]) {
    if (c.snippet) assert.ok(prefixes.has(c.snippet), `${c.label}: snippet "${c.snippet}" missing`);
  }
});

test('completion lists are non-empty and deduplicated', () => {
  for (const [name, list] of Object.entries(completionLists)) {
    assert.ok(list.length > 0, name);
    assert.equal(new Set(list).size, list.length, `${name} has duplicates`);
  }
});

test('join keywords resolve to their own hover doc (longest compound wins, no fallback to a shorter one)', () => {
  const cases = [
    ['t ASOF LEFT JOIN q', 8, 'ASOF LEFT JOIN'],
    ['t ASOF JOIN q', 8, 'ASOF JOIN'],
    ['s TEMPORAL JOIN u', 5, 'TEMPORAL JOIN']
  ];
  for (const [line, ch, expected] of cases) {
    const compound = findCompoundKeywordAt(line, ch);
    const doc = compound && findDoc(compound.keyword);
    assert.equal(doc && doc.keyword, expected, JSON.stringify([line, ch]));
  }
});
