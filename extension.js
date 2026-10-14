const vscode = require('vscode');

// RisingWave keyword documentation database
const risingwaveKeywordDocs = {
  // DDL Keywords
  'CREATE SOURCE': {
    syntax: 'CREATE SOURCE [IF NOT EXISTS] source_name (columns) WITH (connector_options) FORMAT format ENCODE encoding;',
    description: 'Creates a streaming data source. Data is NOT persisted in RisingWave.',
    example: `CREATE SOURCE kafka_events (
  event_id VARCHAR,
  event_time TIMESTAMPTZ
)
WITH (
  connector = 'kafka',
  topic = 'events',
  properties.bootstrap.server = 'broker:9092'
)
FORMAT PLAIN ENCODE JSON;`,
    docUrl: 'https://docs.risingwave.com/sql/commands/sql-create-source'
  },
  'CREATE SINK': {
    syntax: 'CREATE SINK sink_name FROM source_or_mv WITH (connector_options);',
    description: 'Creates a sink to deliver processed data to external systems.',
    example: `CREATE SINK mongo_sink FROM my_mv
WITH (
  connector = 'mongodb',
  type = 'upsert',
  mongodb.url = 'mongodb://localhost:27017',
  collection.name = 'db.collection',
  primary_key = 'id'
);`,
    docUrl: 'https://docs.risingwave.com/sql/commands/sql-create-sink'
  },
  'CREATE MATERIALIZED VIEW': {
    syntax: 'CREATE MATERIALIZED VIEW [IF NOT EXISTS] view_name AS select_query;',
    description: 'Creates an incrementally maintained materialized view. Unlike PostgreSQL, RisingWave MVs are continuously updated with sub-100ms latency.',
    example: `CREATE MATERIALIZED VIEW hourly_stats AS
SELECT
  user_id,
  COUNT(*) AS event_count,
  MAX(event_time) AS last_seen
FROM events
GROUP BY user_id;`,
    docUrl: 'https://docs.risingwave.com/sql/commands/sql-create-mv'
  },
  
  // Window Functions
  'TUMBLE': {
    syntax: 'TUMBLE(time_column, window_size)',
    description: 'Tumbling window function. Creates fixed-size, non-overlapping time windows.',
    example: `SELECT
  TUMBLE_START(event_time, INTERVAL '1 hour') AS window_start,
  TUMBLE_END(event_time, INTERVAL '1 hour') AS window_end,
  COUNT(*) AS cnt
FROM events
GROUP BY TUMBLE(event_time, INTERVAL '1 hour');`,
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'TUMBLE_START': {
    syntax: 'TUMBLE_START(time_column, window_size)',
    description: 'Returns the start timestamp of a tumbling window.',
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'TUMBLE_END': {
    syntax: 'TUMBLE_END(time_column, window_size)',
    description: 'Returns the end timestamp of a tumbling window.',
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'HOP': {
    syntax: 'HOP(time_column, hop_size, window_size)',
    description: 'Hopping (sliding) window function. Creates overlapping windows that advance by hop_size.',
    example: `SELECT
  HOP_START(event_time, INTERVAL '5 min', INTERVAL '1 hour') AS window_start,
  HOP_END(event_time, INTERVAL '5 min', INTERVAL '1 hour') AS window_end,
  AVG(value) AS avg_value
FROM metrics
GROUP BY HOP(event_time, INTERVAL '5 min', INTERVAL '1 hour');`,
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'HOP_START': {
    syntax: 'HOP_START(time_column, hop_size, window_size)',
    description: 'Returns the start timestamp of a hopping window.',
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'HOP_END': {
    syntax: 'HOP_END(time_column, hop_size, window_size)',
    description: 'Returns the end timestamp of a hopping window.',
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  'SESSION': {
    syntax: 'SESSION(time_column, gap_interval)',
    description: 'Session window function. Groups events with gaps less than the specified interval.',
    docUrl: 'https://docs.risingwave.com/processing/window-functions'
  },
  
  // Streaming Keywords
  'EMIT ON WINDOW CLOSE': {
    syntax: 'EMIT ON WINDOW CLOSE',
    description: 'Emits results only when the window closes. Creates append-only output suitable for sinks.',
    example: `CREATE MATERIALIZED VIEW completed_windows AS
SELECT
  TUMBLE_START(event_time, INTERVAL '1 hour') AS window_start,
  COUNT(*) AS final_count
FROM events
GROUP BY TUMBLE(event_time, INTERVAL '1 hour')
EMIT ON WINDOW CLOSE;`,
    docUrl: 'https://docs.risingwave.com/processing/emit-on-window-close'
  },
  'WATERMARK': {
    syntax: 'WATERMARK FOR column AS expression',
    description: 'Defines event-time progress for handling out-of-order data. Typically set to event_time - INTERVAL for late data tolerance.',
    example: `CREATE SOURCE events (
  event_id VARCHAR,
  event_time TIMESTAMPTZ,
  WATERMARK FOR event_time AS event_time - INTERVAL '5 seconds'
)
WITH (connector = 'kafka', ...)
FORMAT PLAIN ENCODE JSON;`,
    docUrl: 'https://docs.risingwave.com/processing/watermarks'
  },
  'ASOF JOIN': {
    syntax: 'table_a ASOF JOIN table_b ON condition',
    description: 'Time-series join that matches each row with the most recent row from the other table based on timestamp.',
    example: `SELECT t.*, q.bid, q.ask
FROM trades t
ASOF JOIN quotes q
ON t.symbol = q.symbol AND t.trade_time >= q.quote_time;`,
    docUrl: 'https://docs.risingwave.com/sql/query-syntax/joins'
  },
  'INCLUDE KEY': {
    syntax: 'INCLUDE KEY AS column_name',
    description: 'Extracts the message key from Kafka as a separate column. Required for UPSERT format.',
    docUrl: 'https://docs.risingwave.com/sql/commands/sql-create-source'
  },
  'INCLUDE TIMESTAMP': {
    syntax: 'INCLUDE TIMESTAMP AS column_name',
    description: 'Extracts the message timestamp from the source as a separate column.',
    docUrl: 'https://docs.risingwave.com/sql/commands/sql-create-source'
  },
  
  // Functions
  'proctime': {
    syntax: 'proctime()',
    description: 'Returns the processing time (wall clock time when RisingWave processes the record). Useful for tracking ingestion time.',
    example: `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  amount DECIMAL,
  ingestion_time TIMESTAMPTZ AS proctime()
) WITH (connector = 'kafka', ...) FORMAT PLAIN ENCODE JSON;`,
    docUrl: 'https://docs.risingwave.com/sql/functions/datetime'
  },
  
  // Connectors
  'kafka': {
    syntax: "connector = 'kafka'",
    description: 'Apache Kafka connector for streaming data ingestion and delivery.',
    parameters: `Required parameters:
• topic - Kafka topic name
• properties.bootstrap.server - Kafka broker address

Optional parameters:
• scan.startup.mode - 'earliest' or 'latest' (default)
• properties.group.id - Consumer group ID`,
    docUrl: 'https://docs.risingwave.com/ingestion/sources/kafka'
  },
  'postgres-cdc': {
    syntax: "connector = 'postgres-cdc'",
    description: 'PostgreSQL Change Data Capture connector for real-time database replication.',
    parameters: `Required parameters:
• hostname - PostgreSQL host
• port - PostgreSQL port (default: 5432)
• username - Database user
• password - Database password
• database.name - Database name

Optional parameters:
• schema.name - Schema name (default: public)
• slot.name - Replication slot name
• publication.name - Publication name`,
    docUrl: 'https://docs.risingwave.com/integrations/sources/postgresql-cdc'
  },
  'sqlserver-cdc': {
    syntax: "connector = 'sqlserver-cdc'",
    description: 'SQL Server Change Data Capture connector for real-time database replication.',
    parameters: `Required parameters:
• hostname - SQL Server host
• port - SQL Server port (default: 1433)
• username - Database user
• password - Database password
• database.name - Database name`,
    docUrl: 'https://docs.risingwave.com/ingestion/sources/sql-server-cdc'
  },
  'mongodb': {
    syntax: "connector = 'mongodb'",
    description: 'MongoDB sink connector for delivering data to MongoDB collections.',
    parameters: `Required parameters:
• mongodb.url - MongoDB connection URL
• collection.name - Collection name (format: db.collection)
• type - 'append-only' or 'upsert'

For upsert:
• primary_key - Primary key column(s)`,
    docUrl: 'https://docs.risingwave.com/integrations/destinations/mongodb'
  },
  'snowflake': {
    syntax: "connector = 'snowflake'",
    description: 'Snowflake sink connector. Requires Snowpipe setup with S3 staging.',
    parameters: `Required parameters:
• s3.bucket_name - S3 staging bucket
• s3.region_name - AWS region
• s3.credentials.access - AWS access key
• s3.credentials.secret - AWS secret key

Optional parameters:
• s3.path - Prefix path in bucket
• force_append_only - Set to 'true' for append-only`,
    docUrl: 'https://docs.risingwave.com/integrations/destinations/snowflake'
  },
  'jdbc': {
    syntax: "connector = 'jdbc'",
    description: 'JDBC sink connector for PostgreSQL, MySQL, and other JDBC-compatible databases.',
    parameters: `Required parameters:
• jdbc.url - JDBC connection URL
• jdbc.username - Database user
• jdbc.password - Database password
• table.name - Target table name
• type - 'append-only' or 'upsert'

For upsert:
• primary_key - Primary key column(s)`,
    docUrl: 'https://docs.risingwave.com/integrations/destinations/postgresql'
  },
  
  // Format and Encoding
  'FORMAT': {
    syntax: 'FORMAT format_type',
    description: 'Specifies the data format for sources and sinks.',
    parameters: `Available formats:
• PLAIN - Simple append-only format
• UPSERT - Key-value format with updates/deletes
• DEBEZIUM - Debezium CDC format
• MAXWELL - Maxwell CDC format
• CANAL - Canal CDC format`,
    docUrl: 'https://docs.risingwave.com/ingestion/formats-and-encoding-options'
  },
  'ENCODE': {
    syntax: 'ENCODE encoding_type',
    description: 'Specifies the data encoding for sources and sinks.',
    parameters: `Available encodings:
• JSON - JSON format
• AVRO - Apache Avro (requires schema registry)
• PROTOBUF - Protocol Buffers
• CSV - Comma-separated values
• BYTES - Raw binary data`,
    docUrl: 'https://docs.risingwave.com/ingestion/formats-and-encoding-options'
  }
};

// Helper function to get word at cursor position
function getWordAtPosition(document, position) {
  // Try to get multiple words (for compound keywords like "CREATE SOURCE")
  const lineText = document.lineAt(position.line).text;
  const beforeCursor = lineText.substring(0, position.character + 20);
  
  // Check for compound keywords
  const compoundKeywords = [
    'CREATE SOURCE', 'CREATE SINK', 'CREATE MATERIALIZED VIEW',
    'DROP SOURCE', 'DROP SINK', 'DROP MATERIALIZED VIEW',
    'EMIT ON WINDOW CLOSE', 'EMIT ON UPDATE', 'EMIT IMMEDIATELY',
    'WATERMARK FOR', 'ASOF JOIN', 'ASOF LEFT JOIN',
    'INCLUDE KEY', 'INCLUDE TIMESTAMP', 'INCLUDE PARTITION', 'INCLUDE OFFSET',
    'TUMBLE_START', 'TUMBLE_END', 'HOP_START', 'HOP_END',
    'SHOW SOURCES', 'SHOW SINKS', 'SHOW MATERIALIZED VIEWS'
  ];
  
  for (const keyword of compoundKeywords) {
    // Case-insensitive word boundary check
    const pattern = new RegExp(String.raw`\b` + keyword + String.raw`\b`, 'i');
    if (pattern.test(beforeCursor)) {
      return keyword.toUpperCase();
    }
  }
  
  // Get single word
  const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z_][a-zA-Z0-9_-]*/);
  if (wordRange) {
    return document.getText(wordRange).toLowerCase();
  }
  
  return null;
}

// Create hover content
function createHoverContent(keyword, docEntry) {
  const markdown = new vscode.MarkdownString();
  markdown.isTrusted = true;
  markdown.supportHtml = true;
  
  // Title
  markdown.appendMarkdown(`### ${keyword}\n\n`);
  
  // Description
  markdown.appendMarkdown(`${docEntry.description}\n\n`);
  
  // Syntax
  if (docEntry.syntax) {
    markdown.appendMarkdown(`**Syntax:**\n\`\`\`sql\n${docEntry.syntax}\n\`\`\`\n\n`);
  }
  
  // Parameters
  if (docEntry.parameters) {
    markdown.appendMarkdown(`**Parameters:**\n\`\`\`\n${docEntry.parameters}\n\`\`\`\n\n`);
  }
  
  // Example
  if (docEntry.example) {
    markdown.appendMarkdown(`**Example:**\n\`\`\`sql\n${docEntry.example}\n\`\`\`\n\n`);
  }
  
  // Doc link
  if (docEntry.docUrl) {
    markdown.appendMarkdown(`[📖 Documentation](${docEntry.docUrl})`);
  }
  
  return new vscode.Hover(markdown);
}

function activate(context) {
  // Register file decoration provider for .rw files
  const decorationProvider = vscode.window.registerFileDecorationProvider({
    provideFileDecoration(uri) {
      if (uri.fsPath.endsWith('.rw')) {
        return {
          badge: 'RW',
          tooltip: 'RisingWave SQL file',
          color: new vscode.ThemeColor('charts.orange')
        };
      }
      return null;
    }
  });
  context.subscriptions.push(decorationProvider);

  // Register hover provider for RisingWave SQL
  const hoverProvider = vscode.languages.registerHoverProvider('risingwave-sql', {
    provideHover(document, position, token) {
      const word = getWordAtPosition(document, position);
      if (!word) return null;
      
      // Check exact match first (case-insensitive)
      const upperWord = word.toUpperCase();
      const lowerWord = word.toLowerCase();
      
      // Check in documentation database
      for (const [keyword, docEntry] of Object.entries(risingwaveKeywordDocs)) {
        if (keyword.toUpperCase() === upperWord || keyword.toLowerCase() === lowerWord) {
          return createHoverContent(keyword, docEntry);
        }
      }
      
      return null;
    }
  });
  context.subscriptions.push(hoverProvider);

  // Register completion provider for connectors and parameters
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    'risingwave-sql',
    {
      provideCompletionItems(document, position, token, context) {
        const completions = [];
        
        // Connector completions
        const connectors = ['kafka', 'postgres-cdc', 'sqlserver-cdc', 'mysql-cdc', 'mongodb-cdc', 'mongodb', 'jdbc', 'snowflake', 'kinesis', 'pulsar', 's3', 'datagen'];
        for (const conn of connectors) {
          const item = new vscode.CompletionItem(conn, vscode.CompletionItemKind.Constant);
          item.detail = 'RisingWave Connector';
          if (risingwaveKeywordDocs[conn]) {
            item.documentation = new vscode.MarkdownString(risingwaveKeywordDocs[conn].description);
          }
          completions.push(item);
        }
        
        // Format completions
        const formats = ['PLAIN', 'UPSERT', 'DEBEZIUM', 'MAXWELL', 'CANAL'];
        for (const fmt of formats) {
          const item = new vscode.CompletionItem(fmt, vscode.CompletionItemKind.Keyword);
          item.detail = 'Data Format';
          completions.push(item);
        }
        
        // Encoding completions
        const encodings = ['JSON', 'AVRO', 'PROTOBUF', 'CSV', 'BYTES'];
        for (const enc of encodings) {
          const item = new vscode.CompletionItem(enc, vscode.CompletionItemKind.Keyword);
          item.detail = 'Data Encoding';
          completions.push(item);
        }
        
        // RisingWave keywords
        const keywords = ['TUMBLE', 'HOP', 'SESSION', 'TUMBLE_START', 'TUMBLE_END', 'HOP_START', 'HOP_END', 'EMIT ON WINDOW CLOSE', 'WATERMARK', 'ASOF JOIN', 'INCLUDE KEY', 'proctime'];
        for (const kw of keywords) {
          const item = new vscode.CompletionItem(kw, vscode.CompletionItemKind.Keyword);
          item.detail = 'RisingWave Keyword';
          if (risingwaveKeywordDocs[kw]) {
            item.documentation = new vscode.MarkdownString(risingwaveKeywordDocs[kw].description);
          }
          completions.push(item);
        }
        
        return completions;
      }
    },
    "'", // Trigger on quote for connector names
    '=' // Trigger on equals for assignments
  );
  context.subscriptions.push(completionProvider);
  
  console.log('RisingWave SQL extension activated');
}

function deactivate() {
  console.log('RisingWave SQL extension deactivated');
}

module.exports = { activate, deactivate };
