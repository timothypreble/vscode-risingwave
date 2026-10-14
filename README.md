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

- **RisingWave DDL**: `CREATE SOURCE`, `CREATE SINK`, `CREATE MATERIALIZED VIEW`
- **Streaming**: `EMIT ON WINDOW CLOSE`, `WATERMARK`, `ASOF JOIN`
- **Windows**: `TUMBLE`, `HOP`, `SESSION`, `TUMBLE_START`, `HOP_END`
- **Connectors**: `kafka`, `postgres-cdc`, `sqlserver-cdc`, `mongodb`, `snowflake`
- **Formats**: `PLAIN`, `UPSERT`, `DEBEZIUM`, `JSON`, `AVRO`

PostgreSQL keywords use standard highlighting (blue in most themes).

**Works with any VS Code color theme!** For best results, use the included "RisingWave Theme".

---

## Hover Documentation

Hover over RisingWave keywords to see documentation:

- **Syntax** and usage examples
- **Parameter descriptions** for connectors
- **Links to official documentation**

Supported keywords include:
- `CREATE SOURCE`, `CREATE SINK`, `CREATE MATERIALIZED VIEW`
- `TUMBLE`, `HOP`, `EMIT ON WINDOW CLOSE`, `WATERMARK`, `ASOF JOIN`
- Connector names: `kafka`, `postgres-cdc`, `sqlserver-cdc`, `mongodb`, `jdbc`, `snowflake`

---

## Code Snippets

### RisingWave Snippets (`.rw` files)

| Prefix | Description |
|--------|-------------|
| `mv` | Create Materialized View |
| `mvwindow` | Materialized View with window |
| **Sources** | |
| `sourcekafka` | Kafka source |
| `sourcekafkaupsert` | Kafka upsert source with primary key |
| `sourcepgcdc` | PostgreSQL CDC source |
| `sourcemssqlcdc` | SQL Server CDC source |
| `sourcemysqlcdc` | MySQL CDC source |
| `sourcedebezium` | Debezium via Kafka (IBM i, Oracle) |
| `sourcedatagen` | Test data generator |
| **Sinks** | |
| `sinkmongo` | MongoDB sink |
| `sinkpg` | PostgreSQL sink |
| `sinkmssql` | SQL Server sink |
| `sinkkafka` | Kafka sink |
| `sinksnowflake` | Snowflake sink (via S3) |
| **Windows & Joins** | |
| `tumble` | Tumbling window |
| `hop` | Hopping (sliding) window |
| `emitclose` | EMIT ON WINDOW CLOSE |
| `asof` | ASOF JOIN |
| `watermark` | Watermark definition |
| **Utility** | |
| `proctime` | Processing time column |
| `showsources` | SHOW SOURCES |
| `showsinks` | SHOW SINKS |
| `showmv` | SHOW MATERIALIZED VIEWS |

### PostgreSQL Snippets (`.rw` and `.sql` files)

| Prefix | Description |
|--------|-------------|
| `table` | CREATE TABLE |
| `insert` | INSERT INTO |
| `upsert` | INSERT ON CONFLICT |
| `index` | CREATE INDEX |
| `fk` | Foreign key constraint |
| `func` | CREATE FUNCTION |
| `win` | Window function |
| `header` | File header block |

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
   npm install -g @vscode/vsce
   cd vscode-risingwave
   vsce package
   ```

2. Install in VS Code:
   - Press `Ctrl+Shift+P` → "Extensions: Install from VSIX..."
   - Select `risingwave-sql-0.2.0.vsix`

### Development

1. Clone the repository
2. Open in VS Code
3. Press `F5` to launch Extension Development Host

---

## Supported Connectors

### Sources (Data Ingestion)
| Connector | Type | Snippet |
|-----------|------|---------|
| Kafka | Streaming | `sourcekafka` |
| PostgreSQL CDC | CDC | `sourcepgcdc` |
| SQL Server CDC | CDC | `sourcemssqlcdc` |
| MySQL CDC | CDC | `sourcemysqlcdc` |
| Debezium (Kafka) | CDC | `sourcedebezium` |
| Datagen | Testing | `sourcedatagen` |

### Sinks (Data Delivery)
| Connector | Type | Snippet |
|-----------|------|---------|
| MongoDB | NoSQL | `sinkmongo` |
| PostgreSQL | RDBMS | `sinkpg` |
| SQL Server | RDBMS | `sinkmssql` |
| Kafka | Streaming | `sinkkafka` |
| Snowflake | Data Warehouse | `sinksnowflake` |

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