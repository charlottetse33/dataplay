Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Starting database introspection for:', connectionData.database_type);
    
    let schema;
    
    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        schema = await introspectPostgreSQL(connectionData);
        break;
      case 'mysql':
        schema = await introspectMySQL(connectionData);
        break;
      case 'sqlite':
        schema = await introspectSQLite(connectionData);
        break;
      case 'mongodb':
        schema = await introspectMongoDB(connectionData);
        break;
      case 'mssql':
      case 'sqlserver':
        schema = await introspectSQLServer(connectionData);
        break;
      default:
        throw new Error(`Unsupported database type: ${connectionData.database_type}`);
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

async function introspectPostgreSQL(connectionData: any) {
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
  const schemasQuery = `
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name;
  `;
  const schemasResult = await client.query(schemasQuery);

  // Get tables and columns
  const tablesQuery = `
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
  `;

  const tablesResult = await client.query(tablesQuery);

  // Get relationships
  const relationshipsQuery = `
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
  `;

  const relationshipsResult = await client.query(relationshipsQuery);
  await client.end();

  return processSchemaResults(tablesResult.rows, relationshipsResult.rows, schemasResult.rows);
}

async function introspectMySQL(connectionData: any) {
  const mysql = await import("npm:mysql2@3.6.5");
  
  const connection = mysql.createConnection({
    host: connectionData.host,
    port: connectionData.port,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    ssl: connectionData.ssl_mode !== 'disable' ? {} : false,
  });

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }

      // Get tables and columns
      const tablesQuery = `
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
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = ?
        ORDER BY TABLE_NAME, ORDINAL_POSITION
      `;

      connection.query(tablesQuery, [connectionData.database], (err, tablesResult) => {
        if (err) {
          connection.end();
          reject(err);
          return;
        }

        // Get relationships
        const relationshipsQuery = `
          SELECT 
            TABLE_SCHEMA as from_schema,
            TABLE_NAME as from_table,
            COLUMN_NAME as from_column,
            REFERENCED_TABLE_SCHEMA as to_schema,
            REFERENCED_TABLE_NAME as to_table,
            REFERENCED_COLUMN_NAME as to_column,
            CONSTRAINT_NAME as constraint_name
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
          WHERE TABLE_SCHEMA = ? AND REFERENCED_TABLE_NAME IS NOT NULL
        `;

        connection.query(relationshipsQuery, [connectionData.database], (err, relationshipsResult) => {
          connection.end();
          
          if (err) {
            reject(err);
            return;
          }

          const schemas = [{ schema_name: connectionData.database }];
          resolve(processSchemaResults(tablesResult, relationshipsResult, schemas));
        });
      });
    });
  });
}

async function introspectSQLite(connectionData: any) {
  const Database = await import("npm:better-sqlite3@9.2.2");
  
  const db = new Database.default(connectionData.database);
  
  // Get all tables
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
  
  const tablesResult = [];
  const relationshipsResult = [];
  
  for (const table of tables) {
    // Get columns for each table
    const columns = db.prepare(`PRAGMA table_info(${table.name})`).all();
    
    columns.forEach((column, index) => {
      tablesResult.push({
        table_schema: 'main',
        table_name: table.name,
        column_name: column.name,
        data_type: column.type,
        is_nullable: column.notnull === 0 ? 'YES' : 'NO',
        column_default: column.dflt_value,
        ordinal_position: index + 1,
        is_primary_key: column.pk === 1,
        is_foreign_key: false // Will be updated below
      });
    });
    
    // Get foreign keys
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list(${table.name})`).all();
    
    foreignKeys.forEach(fk => {
      relationshipsResult.push({
        from_schema: 'main',
        from_table: table.name,
        from_column: fk.from,
        to_schema: 'main',
        to_table: fk.table,
        to_column: fk.to,
        constraint_name: `fk_${table.name}_${fk.from}`
      });
      
      // Mark column as foreign key
      const tableColumn = tablesResult.find(col => 
        col.table_name === table.name && col.column_name === fk.from
      );
      if (tableColumn) {
        tableColumn.is_foreign_key = true;
      }
    });
  }
  
  db.close();
  
  const schemas = [{ schema_name: 'main' }];
  return processSchemaResults(tablesResult, relationshipsResult, schemas);
}

async function introspectMongoDB(connectionData: any) {
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
      data_type: 'Mixed',
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

async function introspectSQLServer(connectionData: any) {
  const sql = await import("npm:mssql@10.0.1");
  
  const config = {
    server: connectionData.host,
    port: connectionData.port,
    database: connectionData.database,
    user: connectionData.username,
    password: connectionData.password,
    options: {
      encrypt: connectionData.ssl_mode !== 'disable',
      trustServerCertificate: true,
    }
  };
  
  const pool = await sql.connect(config);
  
  // Get tables and columns
  const tablesQuery = `
    SELECT 
      s.name as table_schema,
      t.name as table_name,
      c.name as column_name,
      ty.name as data_type,
      CASE WHEN c.is_nullable = 1 THEN 'YES' ELSE 'NO' END as is_nullable,
      c.column_id as ordinal_position,
      CASE WHEN pk.column_name IS NOT NULL THEN 1 ELSE 0 END as is_primary_key,
      CASE WHEN fk.column_name IS NOT NULL THEN 1 ELSE 0 END as is_foreign_key
    FROM sys.tables t
    INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    INNER JOIN sys.columns c ON t.object_id = c.object_id
    INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
    LEFT JOIN (
      SELECT s.name as schema_name, t.name as table_name, c.name as column_name
      FROM sys.key_constraints kc
      INNER JOIN sys.index_columns ic ON kc.parent_object_id = ic.object_id AND kc.unique_index_id = ic.index_id
      INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
      INNER JOIN sys.tables t ON kc.parent_object_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE kc.type = 'PK'
    ) pk ON s.name = pk.schema_name AND t.name = pk.table_name AND c.name = pk.column_name
    LEFT JOIN (
      SELECT s.name as schema_name, t.name as table_name, c.name as column_name
      FROM sys.foreign_key_columns fkc
      INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
      INNER JOIN sys.tables t ON fkc.parent_object_id = t.object_id
      INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
    ) fk ON s.name = fk.schema_name AND t.name = fk.table_name AND c.name = fk.column_name
    ORDER BY s.name, t.name, c.column_id
  `;
  
  const tablesResult = await pool.request().query(tablesQuery);
  
  // Get relationships
  const relationshipsQuery = `
    SELECT 
      ps.name as from_schema,
      pt.name as from_table,
      pc.name as from_column,
      rs.name as to_schema,
      rt.name as to_table,
      rc.name as to_column,
      fk.name as constraint_name
    FROM sys.foreign_keys fk
    INNER JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
    INNER JOIN sys.tables pt ON fkc.parent_object_id = pt.object_id
    INNER JOIN sys.schemas ps ON pt.schema_id = ps.schema_id
    INNER JOIN sys.columns pc ON fkc.parent_object_id = pc.object_id AND fkc.parent_column_id = pc.column_id
    INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
    INNER JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
    INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
  `;
  
  const relationshipsResult = await pool.request().query(relationshipsQuery);
  
  await pool.close();
  
  const schemas = [{ schema_name: 'dbo' }];
  return processSchemaResults(tablesResult.recordset, relationshipsResult.recordset, schemas);
}

function processSchemaResults(tablesData: any[], relationshipsData: any[], schemasData: any[]) {
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
        is_nullable: row.is_nullable === 'YES' || row.is_nullable === 1,
        is_primary_key: row.is_primary_key === true || row.is_primary_key === 1,
        is_foreign_key: row.is_foreign_key === true || row.is_foreign_key === 1,
        column_default: row.column_default,
        ordinal_position: row.ordinal_position
      });
    }
  });

  const tables = Array.from(tablesMap.values());
  
  const relationships = relationshipsData.map(row => ({
    from_table: row.from_schema === 'public' || row.from_schema === 'dbo' ? row.from_table : `${row.from_schema}.${row.from_table}`,
    to_table: row.to_schema === 'public' || row.to_schema === 'dbo' ? row.to_table : `${row.to_schema}.${row.to_table}`,
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