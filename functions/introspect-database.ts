Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Starting database introspection for:', connectionData.database);
    
    // Import PostgreSQL client
    const { Client } = await import("npm:pg@8.11.3");
    
    // Create connection
    const client = new Client({
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      user: connectionData.username,
      password: connectionData.password,
      ssl: connectionData.ssl_mode !== 'disable' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 15000, // 15 second timeout for introspection
      query_timeout: 30000, // 30 second query timeout
    });

    await client.connect();
    console.log('Connected for introspection');

    // First, check what schemas are available
    const schemasQuery = `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `;
    
    const schemasResult = await client.query(schemasQuery);
    console.log('Available schemas:', schemasResult.rows.map(r => r.schema_name));

    // Get all tables and their columns from all accessible schemas
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

    console.log('Executing tables query...');
    const tablesResult = await client.query(tablesQuery);
    console.log(`Found ${tablesResult.rows.length} table/column combinations`);

    // Get foreign key relationships
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

    console.log('Executing relationships query...');
    const relationshipsResult = await client.query(relationshipsQuery);
    console.log(`Found ${relationshipsResult.rows.length} relationships`);

    await client.end();

    // Process the results into the expected format
    const tablesMap = new Map();
    
    tablesResult.rows.forEach(row => {
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
    console.log(`Processed ${tables.length} tables`);
    
    const relationships = relationshipsResult.rows.map(row => ({
      from_table: row.from_schema === 'public' ? row.from_table : `${row.from_schema}.${row.from_table}`,
      to_table: row.to_schema === 'public' ? row.to_table : `${row.to_schema}.${row.to_table}`,
      from_column: row.from_column,
      to_column: row.to_column,
      constraint_name: row.constraint_name,
      relationship_type: 'one-to-many'
    }));

    return new Response(JSON.stringify({
      success: true,
      schema: {
        tables,
        relationships,
        schemas: schemasResult.rows.map(r => r.schema_name)
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database introspection error:', error);
    
    let errorMessage = error.message;
    if (error.code) {
      switch (error.code) {
        case '42501':
          errorMessage = `Permission denied. The user may not have sufficient privileges to read schema information.`;
          break;
        case '42P01':
          errorMessage = `Table or view does not exist. This may be a permissions issue.`;
          break;
        default:
          errorMessage = `Database error (${error.code}): ${error.message}`;
      }
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      code: error.code || 'UNKNOWN',
      details: error.detail || null
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});