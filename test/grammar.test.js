// Tokenizes sample SQL with the real TextMate engine and asserts the scope of selected tokens.
const { test, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vsctm = require('vscode-textmate');
const onig = require('vscode-oniguruma');

const grammarPath = path.join(__dirname, '..', 'syntaxes', 'risingwave.tmLanguage.json');
let grammar;

before(async () => {
  const wasm = fs.readFileSync(path.join(path.dirname(require.resolve('vscode-oniguruma')), 'onig.wasm')).buffer;
  const onigLib = onig.loadWASM(wasm).then(() => ({
    createOnigScanner: (patterns) => new onig.OnigScanner(patterns),
    createOnigString: (s) => new onig.OnigString(s)
  }));
  const registry = new vsctm.Registry({
    onigLib,
    loadGrammar: () => vsctm.parseRawGrammar(fs.readFileSync(grammarPath, 'utf8'), grammarPath)
  });
  grammar = await registry.loadGrammar('source.risingwave-sql');
});

// Returns [{ text, scope }] where scope is the most specific non-punctuation scope.
function tokenize(sql) {
  const out = [];
  let state = vsctm.INITIAL;
  for (const line of sql.split('\n')) {
    const r = grammar.tokenizeLine(line, state);
    for (const t of r.tokens) {
      const text = line.slice(t.startIndex, t.endIndex).trim();
      const scope = t.scopes.slice(1).filter(s => !s.startsWith('punctuation')).pop();
      if (text && scope) out.push({ text, scope });
    }
    state = r.ruleStack;
  }
  return out;
}

// Scope of the nth occurrence (default first) of `text`.
function scopeOf(tokens, text, nth = 0) {
  const hits = tokens.filter(t => t.text === text);
  assert.ok(hits.length > nth, `token "${text}" #${nth} not found`);
  return hits[nth].scope;
}

test('RisingWave DDL and streaming keywords', () => {
  const t = tokenize('CREATE SOURCE s (x INT) WITH (connector = \'kafka\');\nCREATE MATERIALIZED VIEW mv AS SELECT * FROM s EMIT ON WINDOW CLOSE;');
  assert.equal(scopeOf(t, 'CREATE SOURCE'), 'keyword.control.risingwave.ddl');
  assert.equal(scopeOf(t, 'CREATE MATERIALIZED VIEW'), 'keyword.control.risingwave.ddl');
  assert.equal(scopeOf(t, 'EMIT ON WINDOW CLOSE'), 'keyword.control.risingwave.streaming');
});

test('option keys only highlight inside WITH ( ... ) blocks', () => {
  const t = tokenize('SELECT type, connector FROM t;\nCREATE SINK k FROM mv WITH (\n  connector = \'kafka\',\n  type = \'upsert\',\n  properties.bootstrap.server = \'b:9092\'\n);');
  assert.equal(scopeOf(t, 'type', 0), 'keyword.other.postgresql.ddl');
  assert.equal(scopeOf(t, 'connector', 0), 'variable.other.sql');
  assert.equal(scopeOf(t, 'connector', 1), 'keyword.control.risingwave.option');
  assert.equal(scopeOf(t, 'type', 1), 'keyword.control.risingwave.option');
  assert.equal(scopeOf(t, 'properties.bootstrap.server'), 'variable.parameter.risingwave.option');
});

test('connector names are highlighted inside the connector string value', () => {
  const t = tokenize('WITH (connector = \'postgres-cdc\', topic = \'kafka\')');
  assert.equal(scopeOf(t, 'postgres-cdc'), 'constant.language.risingwave.connector');
  assert.equal(scopeOf(t, 'kafka'), 'string.quoted.single.sql');
});

test('JSON is a PostgreSQL type unless preceded by ENCODE', () => {
  const t = tokenize('CREATE TABLE t (payload JSON) FORMAT PLAIN ENCODE JSON;');
  assert.equal(scopeOf(t, 'JSON', 0), 'storage.type.postgresql');
  assert.equal(scopeOf(t, 'JSON', 1), 'constant.language.risingwave.format');
  assert.equal(scopeOf(t, 'PLAIN'), 'constant.language.risingwave.format');
  assert.equal(scopeOf(t, 'FORMAT'), 'keyword.control.risingwave.format');
});

test('ENCODE AVRO ( ... ) opens an option block', () => {
  const t = tokenize('FORMAT UPSERT ENCODE AVRO (schema.registry = \'http://sr:8081\');');
  assert.equal(scopeOf(t, 'AVRO'), 'constant.language.risingwave.format');
  assert.equal(scopeOf(t, 'schema.registry'), 'variable.parameter.risingwave.option');
});

test('PostgreSQL functions are not claimed by the RisingWave function scope', () => {
  const t = tokenize('SELECT LAG(x) OVER (), NOW(), array_agg(y), proctime() FROM t;');
  assert.equal(scopeOf(t, 'LAG'), 'support.function.postgresql.window');
  assert.equal(scopeOf(t, 'NOW'), 'support.function.postgresql.datetime');
  assert.equal(scopeOf(t, 'array_agg'), 'support.function.postgresql.aggregate');
  assert.equal(scopeOf(t, 'proctime'), 'support.function.risingwave');
});

test('comments and strings are not parsed for keywords', () => {
  const t = tokenize('-- CREATE SOURCE in a comment\nSELECT \'CREATE SINK\' FROM t;');
  assert.equal(scopeOf(t, '-- CREATE SOURCE in a comment'), 'comment.line.double-dash.sql');
  assert.equal(scopeOf(t, 'CREATE SINK'), 'string.quoted.single.sql');
});
