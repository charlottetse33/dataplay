Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
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
    });

    await client.connect();

    // Get all tables and their columns
    const tablesQuery = `
      SELECT 
        t.table_name,
        c.column_name,
        c.data_type,
        c.is_nullable,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key,
        CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END as is_foreign_key
      FROM information_schema.tables t
      LEFT JOIN information_schema.columns c ON t.table_name = c.table_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'PRIMARY KEY'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
        SELECT ku.table_name, ku.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage ku ON tc.constraint_name = ku.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
      ORDER BY t.table_name, c.ordinal_position;
    `;

    const tablesResult = await client.query(tablesQuery);

    // Get foreign key relationships
    const relationshipsQuery = `
      SELECT
        tc.table_name as from_table,
        kcu.column_name as from_column,
        ccu.table_name as to_table,
        ccu.column_name as to_column,
        tc.constraint_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;

    const relationshipsResult = await client.query(relationshipsQuery);

    await client.end();

    // Process the results into the expected format
    const tablesMap = new Map();
    
    tablesResult.rows.forEach(row => {
      if (!tablesMap.has(row.table_name)) {
        tablesMap.set(row.table_name, {
          name: row.table_name,
          columns: []
        });
      }
      
      if (row.column_name) {
        tablesMap.get(row.table_name).columns.push({
          name: row.column_name,
          data_type: row.data_type,
          is_nullable: row.is_nullable === 'YES',
          is_primary_key: row.is_primary_key,
          is_foreign_key: row.is_foreign_key
        });
      }
    });

    const tables = Array.from(tablesMap.values());
    
    const relationships = relationshipsResult.rows.map(row => ({
      from_table: row.from_table,
      to_table: row.to_table,
      constraint_name: row.constraint_name,
      relationship_type: 'one-to-many'
    }));

    return new Response(JSON.stringify({
      success: true,
      schema: {
        tables,
        relationships
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database introspection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});