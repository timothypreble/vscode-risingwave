# RisingWave SQL for VS Code

A VS Code extension for developing RisingWave streaming SQL pipelines.

## Features

| Feature | `.rw` Files | `.sql` Files |
|---------|-------------|--------------|
| Syntax Highlighting | ✅ RisingWave + PostgreSQL | ✅ PostgreSQL only |
| Code Snippets | ✅ RisingWave + PostgreSQL | ✅ PostgreSQL only |
| Hover Documentation | ✅ RisingWave keywords | ❌ |
| Code Completion | ✅ Connectors, formats | ❌ |
| File Icon | ✅ Custom `.rw` icon | Default SQL icon |
| File Badge | ✅ Orange "RW" badge | ❌ |

## Syntax Highlighting

RisingWave-specific keywords are highlighted in **orange** to distinguish them from standard PostgreSQL syntax:

<!-- Generated from data/risingwave.json by `npm run build` — do not edit by hand -->
<!-- GEN:highlight START -->
- **RisingWave DDL**: `CREATE SOURCE`, `CREATE SINK`, `CREATE MATERIALIZED VIEW`, `DROP SOURCE`, `DROP SINK`, `DROP MATERIALIZED VIEW`, `ALTER SOURCE`, `ALTER SINK`, `ALTER MATERIALIZED VIEW`
- **Streaming**: `EMIT ON WINDOW CLOSE`, `EMIT ON UPDATE`, `EMIT IMMEDIATELY`, `WATERMARK FOR`, `WITH WATERMARK`, `ASOF JOIN`, `ASOF LEFT JOIN`, `TEMPORAL JOIN`, `INCLUDE KEY`, `INCLUDE TIMESTAMP`, `INCLUDE PARTITION`, `INCLUDE OFFSET`, `INCLUDE HEADER`
- **Windows**: `TUMBLE`, `HOP`, `SESSION`, `TUMBLE_START`, `TUMBLE_END`, `HOP_START`, `HOP_END`, `SESSION_START`, `SESSION_END`
- **Admin**: `SHOW SOURCES`, `SHOW SINKS`, `SHOW MATERIALIZED VIEWS`, `SHOW JOBS`, `SHOW CLUSTERS`, `SHOW INTERNAL TABLES`, `CANCEL JOB`, `CANCEL JOBS`, `RECOVER`, `FLUSH`, `PAUSE`, `RESUME`, `RISECTL`
- **Connectors**: `kafka`, `postgres-cdc`, `sqlserver-cdc`, `mysql-cdc`, `mongodb-cdc`, `kinesis`, `pulsar`, `s3`, `gcs`, `azblob`, `datagen`, `nexmark`, `mongodb`, `jdbc`, `snowflake`, `clickhouse`, `doris`, `starrocks`, `iceberg`, `delta`, `redis`, `elasticsearch`
- **Formats**: `PLAIN`, `UPSERT`, `DEBEZIUM`, `MAXWELL`, `CANAL`
- **Encodings**: `JSON`, `AVRO`, `PROTOBUF`, `CSV`, `BYTES`
- **Types**: `STRUCT`, `JSONB`, `BYTEA`, `TIMESTAMPTZ`, `TIMESTAMP WITH TIME ZONE`, `RWTIMESTAMP`
<!-- GEN:highlight END -->

PostgreSQL keywords use standard highlighting (blue in most themes).

**Works with any VS Code color theme!** For best results, use the included "RisingWave Theme".

---

## Hover Documentation

Hover over RisingWave keywords to see documentation:

- **Syntax** and usage examples
- **Parameter descriptions** for connectors
- **Links to official documentation**

Supported keywords include:
<!-- GEN:hover START -->
- `CREATE SOURCE`, `CREATE SINK`, `CREATE MATERIALIZED VIEW`, `TUMBLE`, `TUMBLE_START`, `TUMBLE_END`, `HOP`, `HOP_START`, `HOP_END`, `SESSION`, `EMIT ON WINDOW CLOSE`, `WATERMARK`, `ASOF JOIN`, `INCLUDE KEY`, `INCLUDE TIMESTAMP`, `proctime`, `FORMAT`, `ENCODE`
- Connector names: `kafka`, `postgres-cdc`, `sqlserver-cdc`, `mongodb`, `snowflake`, `jdbc`
<!-- GEN:hover END -->

---

## Code Snippets

### RisingWave Snippets (`.rw` files)

<!-- GEN:snippets-rw START -->
| Prefix | Description |
|---|---|
| `mv` | Create a RisingWave materialized view (continuously updated) |
| `mvwindow` | Create materialized view with tumbling window aggregation |
| **Sources** |  |
| `sourcekafka` | Create a Kafka source for streaming data ingestion |
| `sourcekafkaupsert` | Create a Kafka source with UPSERT format (requires primary key) |
| `sourcepgcdc` | Create a PostgreSQL CDC source for real-time replication |
| `sourcemssqlcdc` | Create a SQL Server CDC source for real-time replication |
| `sourcemysqlcdc` | Create a MySQL CDC source for real-time replication |
| `sourcedebezium` | Create source from Debezium CDC via Kafka (IBM i, Oracle, etc.) |
| `sourcedatagen` | Create a datagen source for testing (generates mock data) |
| **Sinks** |  |
| `sinkmongo` | Create a MongoDB sink for data delivery |
| `sinkpg` | Create a PostgreSQL sink via JDBC |
| `sinkmssql` | Create a SQL Server sink via JDBC |
| `sinkkafka` | Create a Kafka sink for data delivery |
| `sinksnowflake` | Create a Snowflake sink (via S3 + Snowpipe) |
| **Window Functions** |  |
| `tumble` | Tumbling window aggregation (non-overlapping fixed windows) |
| `hop` | Hopping window aggregation (overlapping sliding windows) |
| `emitclose` | Emit results only when window closes (append-only output) |
| **Joins** |  |
| `asof` | ASOF JOIN for time-series data (matches with nearest timestamp) |
| `temporaljoin` | Temporal join with versioned table |
| **Watermarks** |  |
| `watermark` | Define watermark for event-time processing |
| **Utility** |  |
| `proctime` | Generated column with processing time |
| `computed` | Generated computed column |
| `showsources` | List all sources |
| `showsinks` | List all sinks |
| `showmv` | List all materialized views |
| `desc` | Describe a source, table, or view |
| `explain` | Show query execution plan |
<!-- GEN:snippets-rw END -->

### PostgreSQL Snippets (`.rw` and `.sql` files)

<!-- GEN:snippets-pg START -->
| Prefix | Description |
|---|---|
| `table` | Create a Postgres table |
| `insert` | Insert into a Postgres table |
| `upsert` | Insert with conflict resolution |
| `index` | Create index on a table |
| `fk` | Add a foreign key constraint |
| `func` | Create a Postgres function |
| `win` | Window function example |
| `header` | Insert a standard RisingWave/SQL file header block |
<!-- GEN:snippets-pg END -->

---

## File Icons & Decorations

### Custom Icon
`.rw` files display a custom RisingWave icon in the file explorer.

To enable: Command Palette → "File Icon Theme" → **RisingWave Seti Icons**

### File Badge
All `.rw` files show an orange **"RW"** badge regardless of icon theme.

---

## Installation

### From VSIX (recommended for internal use)

1. Package the extension:
   ```bash
   npm install
   npm run package
   ```

2. Install in VS Code:
   - Press `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
   - Select the generated `risingwave-sql-<version>.vsix`

### Development

1. Clone the repository and run `npm install`
2. Open in VS Code, press `F5` to launch the Extension Development Host

| Command | Purpose |
|---------|---------|
| `npm run build` | Regenerate grammar regexes and README/SKILL tables from `data/risingwave.json` and `snippets/*.json` |
| `npm run check` | Fail if generated files are out of date |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (hover logic, grammar tokenization, drift, manifest paths) |
| `npm run verify` | `check` + `lint` + `test` (runs automatically on `vscode:prepublish`) |
| `npm run package` | Build the `.vsix` |

Keyword/connector/doc data lives in `data/risingwave.json`. Edit it, then run `npm run build`. Sections of `README.md` and `SKILL.md` between `<!-- GEN:* -->` markers are overwritten by the build.

To cut a release, see [RELEASING.md](RELEASING.md).

---

## Supported Connectors

### Sources (Data Ingestion)
<!-- GEN:connectors-sources START -->
| Connector | Type | Snippet |
|---|---|---|
| Kafka | Streaming | `sourcekafka` |
| Kafka (Upsert) | Streaming | `sourcekafkaupsert` |
| Debezium (Kafka) | CDC | `sourcedebezium` |
| PostgreSQL CDC | CDC | `sourcepgcdc` |
| SQL Server CDC | CDC | `sourcemssqlcdc` |
| MySQL CDC | CDC | `sourcemysqlcdc` |
| MongoDB CDC | CDC | — |
| Kinesis | Streaming | — |
| Pulsar | Streaming | — |
| S3 | Object Storage | — |
| GCS | Object Storage | — |
| Azure Blob | Object Storage | — |
| Datagen | Testing | `sourcedatagen` |
| Nexmark | Testing | — |
<!-- GEN:connectors-sources END -->

### Sinks (Data Delivery)
<!-- GEN:connectors-sinks START -->
| Connector | Type | Snippet |
|---|---|---|
| MongoDB | NoSQL | `sinkmongo` |
| PostgreSQL | RDBMS | `sinkpg` |
| SQL Server | RDBMS | `sinkmssql` |
| Kafka | Streaming | `sinkkafka` |
| Kinesis | Streaming | — |
| Pulsar | Streaming | — |
| Snowflake | Data Warehouse | `sinksnowflake` |
| ClickHouse | Data Warehouse | — |
| Doris | Data Warehouse | — |
| StarRocks | Data Warehouse | — |
| Iceberg | Lakehouse | — |
| Delta Lake | Lakehouse | — |
| S3 | Object Storage | — |
| Redis | Cache | — |
| Elasticsearch | Search | — |
<!-- GEN:connectors-sinks END -->

---

## Documentation

- [RisingWave Docs](https://docs.risingwave.com)
- [RisingWave GitHub](https://github.com/risingwavelabs/risingwave)
- [PostgreSQL 15](https://www.postgresql.org/docs/15/)

---

## Credits

- **RisingWave**: [RisingWave Labs](https://risingwave.com)
- **Icon Theme Base**: [Seti UI](https://github.com/jesseweed/seti-ui)
- **Extension**: USXpress