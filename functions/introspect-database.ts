Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Starting database introspection for:', connectionData.database_type, connectionData.database);
    
    let schema = { tables: [], relationships: [], schemas: [] };

    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres': {
        schema = await introspectPostgreSQL(connectionData);
        break;
      }

      case 'mysql': {
        schema = await introspectMySQL(connectionData);
        break;
      }

      case 'sqlite': {
        schema = await introspectSQLite(connectionData);
        break;
      }

      case 'mongodb': {
        schema = await introspectMongoDB(connectionData);
        break;
      }

      default:
        throw new Error(`Schema introspection not supported for: ${connectionData.database_type}`);
    }

    return new Response(JSON.stringify({
      success: true,
      schema
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database introspection error:', error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN',
      details: error.detail || null
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

async function introspectPostgreSQL(connectionData) {
  const { Client } = await import("npm:pg@8.11.3");
  
  const client = new Client({
    host: connectionData.host,
    port: connectionData.port,
    database: connectionData.database,
    user: connectionData.username,
    password: connectionData.password,
    ssl: connectionData.ssl_mode !== 'disable' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
  });

  await client.connect();

  // Get schemas
  const schemasResult = await client.query(`
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name;
  `);

  // Get tables and columns
  const tablesResult = await client.query(`
    SELECT 
      t.table_schema,
      t.table_name,
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      c.ordinal_position,
      CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
      CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key
    FROM information_schema.tables t
    LEFT JOIN information_schema.columns c ON t.table_name = c.table_name AND t.table_schema = c.table_schema
    LEFT JOIN (
      SELECT ku.table_schema, ku.table_name, ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name 
        AND tc.table_schema = ku.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.table_schema = pk.table_schema AND c.table_name = pk.table_name AND c.column_name = pk.column_name
    LEFT JOIN (
      SELECT ku.table_schema, ku.table_name, ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name 
        AND tc.table_schema = ku.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
    ) fk ON c.table_schema = fk.table_schema AND c.table_name = fk.table_name AND c.column_name = fk.column_name
    WHERE t.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_schema, t.table_name, c.ordinal_position;
  `);

  // Get relationships
  const relationshipsResult = await client.query(`
    SELECT
      tc.table_schema as from_schema,
      tc.table_name as from_table,
      kcu.column_name as from_column,
      ccu.table_schema as to_schema,
      ccu.table_name as to_table,
      ccu.column_name as to_column,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name 
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' 
      AND tc.table_schema NOT IN ('information_schema', 'pg_catalog', 'pg_toast');
  `);

  await client.end();

  return processSchemaResults(tablesResult.rows, relationshipsResult.rows, schemasResult.rows);
}

async function introspectMySQL(connectionData) {
  const mysql = await import("npm:mysql2@3.6.5");
  const connection = mysql.createConnection({
    host: connectionData.host,
    port: connectionData.port,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    ssl: connectionData.ssl_mode !== 'disable',
  });

  // Get tables and columns
  const tablesResult = await new Promise((resolve, reject) => {
    connection.query(`
      SELECT 
        TABLE_SCHEMA as table_schema,
        TABLE_NAME as table_name,
        COLUMN_NAME as column_name,
        DATA_TYPE as data_type,
        IS_NULLABLE as is_nullable,
        COLUMN_DEFAULT as column_default,
        ORDINAL_POSITION as ordinal_position,
        CASE WHEN COLUMN_KEY = 'PRI' THEN true ELSE false END as is_primary_key,
        CASE WHEN COLUMN_KEY = 'MUL' THEN true ELSE false END as is_foreign_key
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = ?
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `, [connectionData.database], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  // Get relationships
  const relationshipsResult = await new Promise((resolve, reject) => {
    connection.query(`
      SELECT 
        TABLE_SCHEMA as from_schema,
        TABLE_NAME as from_table,
        COLUMN_NAME as from_column,
        REFERENCED_TABLE_SCHEMA as to_schema,
        REFERENCED_TABLE_NAME as to_table,
        REFERENCED_COLUMN_NAME as to_column,
        CONSTRAINT_NAME as constraint_name
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
    `, [connectionData.database], (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

  connection.end();

  return processSchemaResults(tablesResult, relationshipsResult, [{ schema_name: connectionData.database }]);
}

async function introspectSQLite(connectionData) {
  const { Database } = await import("npm:sqlite3@5.1.6");
  const db = new Database(connectionData.database);

  // Get tables
  const tables = await new Promise((resolve, reject) => {
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const tablesResult = [];
  
  for (const table of tables) {
    const columns = await new Promise((resolve, reject) => {
      db.all(`PRAGMA table_info(${table.name})`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    columns.forEach((col, index) => {
      tablesResult.push({
        table_schema: 'main',
        table_name: table.name,
        column_name: col.name,
        data_type: col.type,
        is_nullable: col.notnull === 0 ? 'YES' : 'NO',
        column_default: col.dflt_value,
        ordinal_position: index + 1,
        is_primary_key: col.pk === 1,
        is_foreign_key: false // SQLite foreign keys need separate query
      });
    });
  }

  db.close();

  return processSchemaResults(tablesResult, [], [{ schema_name: 'main' }]);
}

async function introspectMongoDB(connectionData) {
  const { MongoClient } = await import("npm:mongodb@6.3.0");
  const uri = connectionData.connection_string || 
    `mongodb://${connectionData.username}:${connectionData.password}@${connectionData.host}:${connectionData.port}/${connectionData.database}`;
  
  const client = new MongoClient(uri);
  await client.connect();
  
  const db = client.db(connectionData.database);
  const collections = await db.listCollections().toArray();
  
  const tables = [];
  
  for (const collection of collections) {
    // Sample documents to infer schema
    const sampleDocs = await db.collection(collection.name).find().limit(10).toArray();
    const fields = new Set();
    
    sampleDocs.forEach(doc => {
      Object.keys(doc).forEach(key => fields.add(key));
    });
    
    const columns = Array.from(fields).map((field, index) => ({
      name: field,
      data_type: field === '_id' ? 'ObjectId' : 'Mixed',
      is_nullable: true,
      is_primary_key: field === '_id',
      is_foreign_key: false,
      ordinal_position: index + 1
    }));
    
    tables.push({
      name: collection.name,
      schema: connectionData.database,
      full_name: collection.name,
      columns
    });
  }
  
  await client.close();
  
  return {
    tables,
    relationships: [],
    schemas: [connectionData.database]
  };
}

function processSchemaResults(tablesData, relationshipsData, schemasData) {
  const tablesMap = new Map();
  
  tablesData.forEach(row => {
    const tableKey = `${row.table_schema}.${row.table_name}`;
    if (!tablesMap.has(tableKey)) {
      tablesMap.set(tableKey, {
        name: row.table_name,
        schema: row.table_schema,
        full_name: tableKey,
        columns: []
      });
    }
    
    if (row.column_name) {
      tablesMap.get(tableKey).columns.push({
        name: row.column_name,
        data_type: row.data_type,
        is_nullable: row.is_nullable === 'YES',
        is_primary_key: row.is_primary_key,
        is_foreign_key: row.is_foreign_key,
        column_default: row.column_default,
        ordinal_position: row.ordinal_position
      });
    }
  });

  const tables = Array.from(tablesMap.values());
  
  const relationships = relationshipsData.map(row => ({
    from_table: row.from_schema === 'public' ? row.from_table : `${row.from_schema}.${row.from_table}`,
    to_table: row.to_schema === 'public' ? row.to_table : `${row.to_schema}.${row.to_table}`,
    from_column: row.from_column,
    to_column: row.to_column,
    constraint_name: row.constraint_name,
    relationship_type: 'one-to-many'
  }));

  return {
    tables,
    relationships,
    schemas: schemasData.map(r => r.schema_name)
  };
}