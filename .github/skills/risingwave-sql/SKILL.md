---
name: risingwave-sql
description: "Write RisingWave streaming SQL in .rw files. Use when: materialized views, streaming sources (Kafka, PostgreSQL CDC, SQL Server CDC, IBM i), sinks (MongoDB, PostgreSQL, SQL Server, Kafka, Snowflake), window functions (TUMBLE, HOP), ASOF joins, watermarks, emit on window close, or streaming database queries. Knows RisingWave vs PostgreSQL syntax differences."
compatibility:
  - vscode-copilot
  - windsurf
  - claude-code
metadata:
  author: USXpress
  tags:
    - risingwave
    - streaming
    - sql
    - kafka
    - cdc
    - materialized-views
---

# RisingWave SQL

Write streaming SQL queries for RisingWave, a PostgreSQL-compatible streaming database.

## When to Use This Skill

Use this skill when:
- Writing `.rw` files with RisingWave SQL
- Creating streaming sources from Kafka, PostgreSQL CDC, SQL Server CDC, or IBM i
- Building materialized views for incremental computation
- Creating sinks to MongoDB, PostgreSQL, SQL Server, Kafka, or Snowflake
- Using window functions (TUMBLE, HOP) for time-based aggregations
- Writing ASOF joins for time-series data
- Configuring watermarks and emit-on-window-close semantics

## Documentation References

| Resource | URL |
|----------|-----|
| RisingWave Docs | https://docs.risingwave.com/get-started/intro |
| GitHub | https://github.com/risingwavelabs/risingwave |
| Docs Repo | https://github.com/risingwavelabs/risingwave-docs |
| PostgreSQL 12 (for comparison) | https://www.postgresql.org/docs/12/index.html |

---

## RisingWave vs PostgreSQL Syntax Differences

**CRITICAL**: RisingWave is PostgreSQL-compatible but has streaming-specific extensions.

| Feature | RisingWave | PostgreSQL |
|---------|-----------|------------|
| Incremental views | `CREATE MATERIALIZED VIEW` (continuously updated) | `CREATE MATERIALIZED VIEW` (manual refresh) |
| Data ingestion | `CREATE SOURCE` with connectors | N/A |
| Data delivery | `CREATE SINK` with connectors | N/A |
| Window functions | `TUMBLE()`, `HOP()`, `SESSION()` | N/A |
| Time-series joins | `ASOF JOIN` | N/A |
| Processing time | `proctime()` function | N/A |
| Watermarks | `WATERMARK FOR col AS expr` | N/A |
| Emit policy | `EMIT ON WINDOW CLOSE` | N/A |
| Primary key in source | Required for CDC tables | Optional |
| Identifiers | Case-insensitive (quote for case-sensitive) | Case-insensitive |

### Key Behavioral Differences

1. **Materialized Views are Incremental**: In RisingWave, MVs are continuously updated with sub-100ms latency. No `REFRESH MATERIALIZED VIEW` needed.

2. **Sources vs Tables**:
   - `CREATE SOURCE`: Data is NOT persisted in RisingWave
   - `CREATE TABLE ... WITH (connector=...)`: Data IS persisted
   - For CDC (Debezium, Maxwell, Canal), you MUST use `CREATE TABLE`

3. **Primary Keys Required**: CDC tables and upsert sinks require primary keys matching the upstream.

4. **NOT NULL Not Supported in Sources**: Use `CREATE TABLE` instead if you need NOT NULL enforcement.

---

## Sources (Data Ingestion)

### Kafka Source

```sql
CREATE SOURCE kafka_events (
    event_id VARCHAR,
    user_id INT,
    event_time TIMESTAMPTZ,
    payload JSONB
)
WITH (
    connector = 'kafka',
    topic = 'events',
    properties.bootstrap.server = 'broker:9092',
    scan.startup.mode = 'earliest'  -- or 'latest'
)
FORMAT PLAIN ENCODE JSON;
```

**Upsert Kafka Source** (with primary key):
```sql
CREATE SOURCE kafka_users (
    PRIMARY KEY (rw_key),
    id INT,
    name VARCHAR,
    updated_at TIMESTAMPTZ
)
INCLUDE KEY AS rw_key
WITH (
    connector = 'kafka',
    topic = 'user_updates',
    properties.bootstrap.server = 'broker:9092'
)
FORMAT UPSERT ENCODE JSON;
```

### PostgreSQL CDC Source

```sql
-- Step 1: Create shared CDC source
CREATE SOURCE pg_source WITH (
    connector = 'postgres-cdc',
    hostname = 'postgres-host',
    port = '5432',
    username = 'replication_user',
    password = 'your_password',
    database.name = 'source_db',
    schema.name = 'public',
    slot.name = 'rw_slot',
    publication.name = 'rw_publication'
);

-- Step 2: Create table from source (auto-maps schema with *)
CREATE TABLE orders (*) FROM pg_source TABLE 'public.orders';

-- Or explicitly define columns:
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    total DECIMAL,
    created_at TIMESTAMPTZ
) FROM pg_source TABLE 'public.orders';
```

### SQL Server CDC Source

```sql
-- Step 1: Create shared CDC source
CREATE SOURCE mssql_source WITH (
    connector = 'sqlserver-cdc',
    hostname = 'sqlserver-host',
    port = '1433',
    username = 'sa',
    password = 'your_password',
    database.name = 'source_db'
);

-- Step 2: Create table from source
-- Note: Schema name required (e.g., 'dbo.orders')
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    customer_id INT,
    status VARCHAR
) FROM mssql_source TABLE 'dbo.orders';

-- Auto-map schema:
CREATE TABLE orders (*) FROM mssql_source TABLE 'dbo.orders';
```

### IBM i Source (via Kafka/Debezium)

IBM i doesn't have native CDC support. Use Debezium + Kafka:

```sql
CREATE SOURCE ibmi_transactions (
    txn_id VARCHAR,
    account_number VARCHAR,
    amount DECIMAL,
    txn_date DATE
)
WITH (
    connector = 'kafka',
    topic = 'ibmi.LIBRARY.TRANSACTIONS',
    properties.bootstrap.server = 'broker:9092'
)
FORMAT DEBEZIUM ENCODE JSON;
```

---

## Sinks (Data Delivery)

### MongoDB Sink

```sql
-- Append-only sink
CREATE SINK mongo_events_sink FROM events_mv
WITH (
    connector = 'mongodb',
    type = 'append-only',
    mongodb.url = 'mongodb://mongo:27017/?replicaSet=rs0',
    collection.name = 'analytics.events'
);

-- Upsert sink (requires primary key)
CREATE SINK mongo_users_sink FROM users_mv
WITH (
    connector = 'mongodb',
    type = 'upsert',
    mongodb.url = 'mongodb://mongo:27017/?replicaSet=rs0',
    collection.name = 'app.users',
    primary_key = 'user_id'
);
```

### PostgreSQL Sink

```sql
CREATE SINK pg_sink FROM aggregated_metrics
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:postgresql://postgres:5432/analytics',
    jdbc.username = 'writer',
    jdbc.password = 'your_password',
    table.name = 'metrics',
    type = 'upsert',
    primary_key = 'metric_id'
);
```

### SQL Server Sink

```sql
CREATE SINK mssql_sink FROM processed_orders
WITH (
    connector = 'jdbc',
    jdbc.url = 'jdbc:sqlserver://sqlserver:1433;databaseName=warehouse',
    jdbc.username = 'writer',
    jdbc.password = 'your_password',
    table.name = 'dbo.processed_orders',
    type = 'upsert',
    primary_key = 'order_id'
);
```

### Kafka Sink

```sql
-- JSON encoding
CREATE SINK kafka_output FROM processed_events
WITH (
    connector = 'kafka',
    properties.bootstrap.server = 'broker:9092',
    topic = 'processed-events'
)
FORMAT PLAIN ENCODE JSON;

-- Upsert with Avro encoding
CREATE SINK kafka_upsert_sink FROM user_states
WITH (
    connector = 'kafka',
    properties.bootstrap.server = 'broker:9092',
    topic = 'user-states',
    primary_key = 'user_id'
)
FORMAT UPSERT ENCODE AVRO (
    schema.registry = 'http://schema-registry:8081'
);

-- Debezium CDC format
CREATE SINK kafka_cdc_sink FROM order_changes
WITH (
    connector = 'kafka',
    properties.bootstrap.server = 'broker:9092',
    topic = 'order-changes',
    primary_key = 'order_id'
)
FORMAT DEBEZIUM ENCODE JSON;
```

### Snowflake Sink (via S3)

```sql
CREATE SINK snowflake_sink FROM daily_metrics
WITH (
    connector = 'snowflake',
    type = 'append-only',
    s3.bucket_name = 'my-staging-bucket',
    s3.path = 'risingwave/metrics',
    s3.region_name = 'us-west-2',
    s3.credentials.access = 'AWS_ACCESS_KEY',
    s3.credentials.secret = 'AWS_SECRET_KEY',
    force_append_only = 'true'
);
```

**Note**: Snowflake sink requires Snowpipe setup. See [docs](https://docs.risingwave.com/integrations/destinations/snowflake).

---

## Materialized Views

### Basic Materialized View

```sql
CREATE MATERIALIZED VIEW active_users AS
SELECT
    user_id,
    COUNT(*) AS event_count,
    MAX(event_time) AS last_seen
FROM user_events
WHERE event_time > NOW() - INTERVAL '24 hours'
GROUP BY user_id;
```

### With Joins

```sql
CREATE MATERIALIZED VIEW enriched_orders AS
SELECT
    o.order_id,
    o.total,
    c.name AS customer_name,
    c.email
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id;
```

---

## Window Functions (RisingWave-Specific)

### Tumbling Window

Fixed, non-overlapping time windows:

```sql
CREATE MATERIALIZED VIEW hourly_stats AS
SELECT
    TUMBLE_START(event_time, INTERVAL '1 hour') AS window_start,
    TUMBLE_END(event_time, INTERVAL '1 hour') AS window_end,
    COUNT(*) AS event_count,
    SUM(amount) AS total_amount
FROM transactions
GROUP BY TUMBLE(event_time, INTERVAL '1 hour');
```

### Hopping Window

Overlapping time windows:

```sql
CREATE MATERIALIZED VIEW sliding_avg AS
SELECT
    HOP_START(event_time, INTERVAL '5 minutes', INTERVAL '1 hour') AS window_start,
    HOP_END(event_time, INTERVAL '5 minutes', INTERVAL '1 hour') AS window_end,
    AVG(temperature) AS avg_temp
FROM sensor_readings
GROUP BY HOP(event_time, INTERVAL '5 minutes', INTERVAL '1 hour');
```

### Emit on Window Close

For append-only output when windows complete:

```sql
CREATE MATERIALIZED VIEW completed_windows AS
SELECT
    TUMBLE_START(event_time, INTERVAL '1 hour') AS window_start,
    COUNT(*) AS final_count
FROM events
GROUP BY TUMBLE(event_time, INTERVAL '1 hour')
EMIT ON WINDOW CLOSE;
```

---

## ASOF Joins (Time-Series)

Join records by closest timestamp:

```sql
SELECT
    t.trade_id,
    t.symbol,
    t.price AS trade_price,
    q.bid,
    q.ask
FROM trades t
ASOF JOIN quotes q
ON t.symbol = q.symbol AND t.trade_time >= q.quote_time;
```

---

## Watermarks

Define event-time progress for out-of-order data:

```sql
CREATE SOURCE events (
    event_id VARCHAR,
    event_time TIMESTAMPTZ,
    data JSONB,
    WATERMARK FOR event_time AS event_time - INTERVAL '5 seconds'
)
WITH (
    connector = 'kafka',
    topic = 'events',
    properties.bootstrap.server = 'broker:9092'
)
FORMAT PLAIN ENCODE JSON;
```

---

## Generated Columns & Processing Time

```sql
CREATE TABLE orders (
    order_id INT PRIMARY KEY,
    amount DECIMAL,
    -- Processing time (when RisingWave receives the record)
    ingestion_time TIMESTAMPTZ AS proctime(),
    -- Computed column
    amount_with_tax DECIMAL AS amount * 1.08
) WITH (
    connector = 'kafka',
    topic = 'orders',
    properties.bootstrap.server = 'broker:9092'
) FORMAT PLAIN ENCODE JSON;
```

**Note**: Generated columns must appear at the END of the schema definition.

---

## Data Type Mapping

### PostgreSQL CDC → RisingWave

| PostgreSQL | RisingWave |
|------------|------------|
| BOOLEAN | BOOLEAN |
| SMALLINT, SMALLSERIAL | SMALLINT |
| INTEGER, SERIAL | INTEGER |
| BIGINT, BIGSERIAL | BIGINT |
| REAL | REAL |
| DOUBLE PRECISION | DOUBLE PRECISION |
| NUMERIC, DECIMAL | NUMERIC (up to 28 digits) |
| VARCHAR, TEXT, CHAR | CHARACTER VARYING |
| BYTEA | BYTEA |
| JSON, JSONB | JSONB |
| DATE | DATE |
| TIMESTAMP | TIMESTAMP WITHOUT TIME ZONE |
| TIMESTAMPTZ | TIMESTAMP WITH TIME ZONE |
| UUID | CHARACTER VARYING |

### SQL Server CDC → RisingWave

| SQL Server | RisingWave |
|------------|------------|
| BIT | BOOLEAN |
| TINYINT, SMALLINT | SMALLINT |
| INT | INTEGER |
| BIGINT | BIGINT |
| REAL | REAL |
| FLOAT | DOUBLE PRECISION |
| NUMERIC, DECIMAL | NUMERIC |
| VARCHAR, NVARCHAR, TEXT | CHARACTER VARYING |
| BINARY, VARBINARY | BYTEA |
| DATE | DATE |
| DATETIME, DATETIME2 | TIMESTAMP WITHOUT TIME ZONE |
| DATETIMEOFFSET | TIMESTAMP WITH TIME ZONE |

---

## Common Patterns

### CDC Pipeline (PostgreSQL → MongoDB)

```sql
-- Source
CREATE SOURCE pg_orders_source WITH (
    connector = 'postgres-cdc',
    hostname = 'postgres',
    port = '5432',
    username = 'cdc_user',
    password = 'password',
    database.name = 'ecommerce'
);

CREATE TABLE orders (*) FROM pg_orders_source TABLE 'public.orders';

-- Transform
CREATE MATERIALIZED VIEW order_summaries AS
SELECT
    customer_id,
    COUNT(*) AS order_count,
    SUM(total) AS lifetime_value,
    MAX(order_date) AS last_order
FROM orders
GROUP BY customer_id;

-- Sink
CREATE SINK mongo_customers FROM order_summaries
WITH (
    connector = 'mongodb',
    type = 'upsert',
    mongodb.url = 'mongodb://mongo:27017/?replicaSet=rs0',
    collection.name = 'analytics.customer_summaries',
    primary_key = 'customer_id'
);
```

### Real-Time Alerting

```sql
CREATE MATERIALIZED VIEW fraud_alerts AS
SELECT
    user_id,
    COUNT(*) AS txn_count,
    SUM(amount) AS total_amount,
    TUMBLE_START(txn_time, INTERVAL '5 minutes') AS window_start
FROM transactions
WHERE amount > 10000
GROUP BY user_id, TUMBLE(txn_time, INTERVAL '5 minutes')
HAVING COUNT(*) > 5;
```

---

## File Format

- **Extension**: `.rw`
- **Language ID**: `risingwave-sql`
- **VS Code Extension**: RisingWave SQL (syntax highlighting, snippets, theme)

## Snippet Prefixes

| Prefix | Description |
|--------|-------------|
| `mv` | Create Materialized View |
| `sourcekafka` | Create Kafka Source |
| `sinkpg` | Create PostgreSQL Sink |
| `tumble` | Tumbling Window Aggregation |
| `hop` | Hopping Window Aggregation |
| `asof` | ASOF Join |
| `emitclose` | Emit on Window Close |
