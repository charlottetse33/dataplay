Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    // Import PostgreSQL client with proper destructuring
    const pg = await import("npm:pg@8.11.3");
    const { Client } = pg.default || pg;
    
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
    
    // Simple query to verify connection
    const result = await client.query('SELECT NOW() as current_time');
    
    await client.end();

    return new Response(JSON.stringify({
      success: true,
      message: 'Connection successful',
      server_time: result.rows[0].current_time
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