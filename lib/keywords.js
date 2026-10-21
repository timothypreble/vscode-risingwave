// Pure keyword/doc logic shared by extension.js and the tests. No dependency on the vscode API.
const data = require('../data/risingwave.json');

// Hover documentation database. Multi-line fields are stored as line arrays in JSON.
const risingwaveKeywordDocs = Object.fromEntries(
  Object.entries(data.docs).map(([keyword, entry]) => [keyword, {
    ...entry,
    ...(entry.example && { example: entry.example.join('\n') }),
    ...(entry.parameters && { parameters: entry.parameters.join('\n') })
  }])
);

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const allKeywords = Object.values(data.keywords).flat();

// Compound keywords (e.g. 'CREATE SOURCE'), longest first so 'ASOF LEFT JOIN' wins over 'ASOF JOIN'
const compoundKeywords = allKeywords
  .filter(keyword => /[\s_.]/.test(keyword))
  .sort((a, b) => b.length - a.length)
  .map(keyword => ({
    keyword,
    regex: new RegExp(String.raw`\b` + escapeRegex(keyword).split(' ').join(String.raw`\s+`) + String.raw`\b`, 'gi')
  }));

// Find compound keyword whose span contains `character` on `lineText`
function findCompoundKeywordAt(lineText, character) {
  for (const { keyword, regex } of compoundKeywords) {
    regex.lastIndex = 0;
    let m;
    while ((m = regex.exec(lineText))) {
      const start = m.index;
      const end = start + m[0].length;
      if (start <= character && character <= end) {
        return { keyword, start, end };
      }
    }
  }
  return null;
}

// Case-insensitive lookup in the documentation database
function findDoc(word) {
  const upperWord = word.toUpperCase();
  for (const [keyword, docEntry] of Object.entries(risingwaveKeywordDocs)) {
    if (keyword.toUpperCase() === upperWord) return { keyword, docEntry };
  }
  return null;
}

// Completion lists
const completionLists = {
  connectors: [...new Set([...data.connectors.sources, ...data.connectors.sinks].map(c => c.name))],
  formats: data.formats,
  encodings: data.encodings,
  keywords: [...data.keywords.window, ...data.keywords.streaming, ...data.functions]
};

module.exports = { data, risingwaveKeywordDocs, compoundKeywords, findCompoundKeywordAt, findDoc, completionLists };
