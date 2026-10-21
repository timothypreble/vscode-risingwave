# User flows

This is a local editor extension, so there is **no signup, login, account or backend session**. The flows below are the real journeys: install → first use → everyday authoring → power use, plus the contributor and release paths.

See also: [features](features.md) · [architecture](architecture.md) · [UI & theming](frontend.md)

## Personas

| Persona | Goal | Entry point |
|---|---|---|
| Pipeline author | Write RisingWave streaming SQL in `.rw` files quickly and correctly | Install `.vsix`, open a `.rw` file |
| Power user | Move fast with snippets, compound-keyword hovers, themed output; also edit `.sql` | Command palette, snippets, theme and icon theme |
| Contributor | Add keywords, connectors, snippets or grammar rules | Clone repo, edit data, `npm run build` |
| Releaser | Ship a new `.vsix` | `RELEASING.md` |

## 1. Install ("signup" equivalent)

```mermaid
flowchart TD
    A([Need the extension]) --> B{Source?}
    B -- "GitHub Release (recommended)" --> C["Download risingwave-sql-&lt;version&gt;.vsix<br/>from release Assets"]
    B -- "Rolling dev pre-release" --> C2["Download ...-dev.&lt;sha&gt;.vsix<br/>(unreleased, may change)"]
    B -- "From source" --> S["npm ci && npm run package<br/>→ dist/*.vsix"]
    C --> I
    C2 --> I
    S --> I
    I{"Install how?"}
    I -- "UI" --> U["Cmd/Ctrl+Shift+P →<br/>Extensions: Install from VSIX…"]
    I -- "CLI" --> CLI["code --install-extension &lt;file&gt;.vsix"]
    U --> R["Reload window if prompted"]
    CLI --> R
    R --> O([Open any .rw file])
    O --> ACT["onLanguage:risingwave-sql fires<br/>extension activates"]
    ACT --> READY([Highlighting, hover, completion, snippets, RW badge active])
```

Updating is the same flow: installing a newer `.vsix` replaces the old one. There is no auto-update because the extension is not published to a marketplace.

## 2. First-time use (first `.rw` file)

```mermaid
flowchart TD
    A([Open or create a .rw file]) --> B["Language mode = RisingWave SQL<br/>(by extension, or pick manually)"]
    B --> C["Orange 'RW' badge appears in Explorer"]
    B --> D["Keywords highlighted<br/>orange = RisingWave, blue = PostgreSQL"]
    D --> E{"Looks right with<br/>current colour theme?"}
    E -- yes --> F([Start writing])
    E -- "want orange emphasis" --> G["Preferences: Color Theme →<br/>RisingWave Theme"]
    G --> F
    C --> H{"Want custom file icon?"}
    H -- yes --> I["File Icon Theme →<br/>RisingWave Seti Icons"]
    H -- no --> F
    I --> F
```

Opting in to the theme and icon theme is optional and independent.

## 3. Everyday authoring: build a pipeline

```mermaid
flowchart TD
    S([New pipeline]) --> H["Type 'header' → file header block"]
    H --> SRC["Type 'sourcekafka' / 'sourcepgcdc' /<br/>'sourcemssqlcdc' / 'sourcedatagen'"]
    SRC --> T["Tab through placeholders<br/>topic, bootstrap server, columns"]
    T --> OPT["Inside WITH ( … ) type connector = '<br/>→ completion lists connector names"]
    OPT --> HOV1["Hover CREATE SOURCE, kafka, FORMAT, ENCODE<br/>→ syntax, parameters, example, docs link"]
    HOV1 --> MV["Type 'mv' or 'mvwindow'<br/>→ materialized view"]
    MV --> WIN["'tumble' / 'hop' / 'emitclose'<br/>'watermark', 'asof', 'temporaljoin'"]
    WIN --> SNK["Type 'sinkpg' / 'sinkkafka' / 'sinkmongo' /<br/>'sinksnowflake'"]
    SNK --> CHK["Check highlighting:<br/>unrecognised option keys show as parameters,<br/>strings / comments suppress keywords"]
    CHK --> OPS["'showsources', 'showmv', 'desc', 'explain'<br/>for inspection statements"]
    OPS --> DONE([Run the SQL against RisingWave elsewhere])
```

The extension **does not connect to RisingWave, run, lint or validate SQL**. It is purely an authoring aid; execution happens in `psql`, a DB client or CI.

### Hover decision flow

```mermaid
flowchart TD
    A([Mouse over token]) --> B{"Cursor inside a<br/>compound keyword span?<br/>(longest match first)"}
    B -- yes --> C{"Doc entry<br/>for compound?"}
    C -- yes --> SHOW([Show hover with range = whole keyword])
    C -- no --> D
    B -- no --> D{"Single word<br/>has doc entry?<br/>(case-insensitive)"}
    D -- yes --> SHOW2([Show hover with range = word])
    D -- no --> NONE([No hover])
```

Examples: hovering `my_src` in `CREATE SOURCE my_src` shows nothing; `WATERMARK FOR` shows the `WATERMARK` doc; `postgres-cdc` shows the connector doc; `ASOF LEFT JOIN` resolves to its own doc (the longest compound wins; there is no fallback to the shorter `ASOF JOIN`, so every compound keyword needs its own entry to show a hover).

### Completion decision flow

```mermaid
flowchart LR
    T["Typing, or<br/>' / = pressed"] --> P["provideCompletionItems"]
    P --> L["Always return full list"]
    L --> C["Connectors"]
    L --> F["Formats"]
    L --> E["Encodings"]
    L --> K["Window + streaming keywords + functions"]
    C & F & E & K --> V["VS Code filters by typed prefix"]
```

Filtering is done by VS Code on the typed prefix; the extension does not look at context (e.g. it will offer `kafka` outside a `WITH` block).

## 4. Power-user paths

| Path | How | Why it helps |
|---|---|---|
| Snippet aliases | Many snippets have two prefixes (`sourcekafka` / `kafkasource`, `mv` / `createmv`) | Use whichever you remember |
| Postgres snippets in `.sql` | `table`, `insert`, `upsert`, `index`, `fk`, `func`, `win`, `header` also work in plain `.sql` files | Same muscle memory outside `.rw` |
| Scope inspection | **Developer: Inspect Editor Tokens and Scopes** | Debug why something is coloured as it is; target scopes in `editor.tokenColorCustomizations` |
| Custom token colours | Override `keyword.control.risingwave.*` etc. in user settings with any theme | Keep your theme, change RisingWave accents. See [frontend](frontend.md) |
| Explicit language mode | Set a non-`.rw` file (e.g. `.sql`) to **RisingWave SQL** via the status bar | Get hover and completion on files that are not named `.rw` |
| Agent skill | `.github/skills/risingwave-sql/SKILL.md` | Gives Copilot/Cursor/Claude Code RisingWave-vs-PostgreSQL syntax guidance in this repo |

```mermaid
flowchart TD
    A([Existing .sql file with RisingWave statements]) --> B["Status bar language mode →<br/>RisingWave SQL"]
    B --> C["Full grammar + hover + completion enabled"]
    C --> D{"Want it permanent?"}
    D -- yes --> E["files.associations: *.sql → risingwave-sql<br/>(per workspace)"]
    D -- no --> F([Done])
    E --> F
```

## 5. Contributor flow

```mermaid
flowchart TD
    A([Want to change behaviour]) --> B{"What kind of change?"}
    B -- "Keyword / connector / hover doc" --> D["Edit data/risingwave.json"]
    B -- "Snippet" --> S["Edit snippets/*.json"]
    B -- "Highlighting structure" --> G["Edit syntaxes/*.tmLanguage.json<br/>(non-generated parts only)"]
    B -- "Colours" --> T["Edit themes/risingwave-color-theme.json"]
    B -- "Hover / completion code" --> X["Edit lib/keywords.js (logic)<br/>or extension.js (vscode glue)"]
    D --> BU["npm run build"]
    S --> BU
    G --> BU
    BU --> TEST{"Highlighting change?"}
    G --> TEST
    TEST -- yes --> GT["Add case to test/grammar.test.js"]
    TEST -- no --> V
    GT --> V["npm run verify<br/>(check + lint + test)"]
    X --> V
    T --> V
    V --> F5["Press F5 → Extension Development Host<br/>manual check of hover / completion"]
    F5 --> CL["Add entry to CHANGELOG [Unreleased]"]
    CL --> PR([Open PR to dev / main])
    PR --> CI["ci.yml runs npm run package"]
```

Hard rules: never hand-edit between `GEN:*` markers or generated grammar `match`/`begin` lines; do not commit `.vsix` files.

## 6. Release flow

```mermaid
flowchart TD
    A([Unreleased section has content]) --> B["npm ci && npm run verify"]
    B --> C["npm version X.Y.Z --no-git-tag-version"]
    C --> D["CHANGELOG: Unreleased → [X.Y.Z] - date,<br/>add new empty Unreleased"]
    D --> E["npm run package → dist/*.vsix"]
    E --> F["Smoke test in clean VS Code:<br/>highlighting, hover, completion, snippets, badge"]
    F --> G["Commit 'Release X.Y.Z', open PR dev → main"]
    G --> H["Merge → release.yml<br/>tags vX.Y.Z, creates GitHub Release with vsix"]
    H --> I([Share vsix from the Release])
```

Details and the checklist: [RELEASING.md](../RELEASING.md).

## 7. Troubleshooting paths

| Symptom | Likely cause | Fix |
|---|---|---|
| No hover / completion | File is not in `risingwave-sql` mode (e.g. `.sql`) | Set language mode to **RisingWave SQL** |
| No orange keywords | Theme overrides colours, or `.sql` file (PostgreSQL scopes only) | Use **RisingWave Theme** or set `editor.tokenColorCustomizations` |
| Custom `.rw` icon missing | Icon theme not selected | **File Icon Theme → RisingWave Seti Icons** |
| `RW` badge missing | File does not end in `.rw` | Rename; badge keys off the file extension only |
| `type`/`connector` not coloured | Used outside `WITH ( … )` / `ENCODE x ( … )` | By design; option keys only highlight inside option blocks |
| `JSON` coloured as a PostgreSQL type | Not preceded by `ENCODE` | By design |
| Hover missing on a keyword split across lines | Compound keywords match within one line | Known limitation, see [audit](audit.md#known-limitations) |
| `npm run check` fails | Edited data/snippets without rebuilding | `npm run build`, commit result |
