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

    // Test connection
    await client.connect();
    
    // Simple test query
    await client.query('SELECT 1');
    
    await client.end();

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful"
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database connection error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});