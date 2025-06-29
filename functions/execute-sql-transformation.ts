Deno.serve(async (req) => {
  try {
    const { connectionData, sqlCode } = await req.json();
    
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

    // Execute the SQL transformation
    console.log('Executing SQL:', sqlCode);
    const result = await client.query(sqlCode);
    
    await client.end();

    return new Response(JSON.stringify({
      success: true,
      result: `SQL executed successfully. Rows affected: ${result.rowCount || 0}`,
      rowCount: result.rowCount
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('SQL execution error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});