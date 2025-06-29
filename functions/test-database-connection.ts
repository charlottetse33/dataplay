Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Testing connection to:', {
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      username: connectionData.username,
      ssl_mode: connectionData.ssl_mode
    });
    
    // Import PostgreSQL client
    const { Client } = await import("npm:pg@8.11.3");
    
    // Create connection with more detailed configuration
    const client = new Client({
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      user: connectionData.username,
      password: connectionData.password,
      ssl: connectionData.ssl_mode !== 'disable' ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000, // 10 second timeout
      query_timeout: 5000, // 5 second query timeout
    });

    console.log('Attempting to connect...');
    await client.connect();
    console.log('Connected successfully');
    
    // Simple test query that works with read-only access
    console.log('Running test query...');
    const result = await client.query('SELECT 1 as test, current_database() as db_name, current_user as username');
    console.log('Test query result:', result.rows[0]);
    
    await client.end();
    console.log('Connection closed');

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful",
      details: {
        database: result.rows[0].db_name,
        user: result.rows[0].username
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database connection error:', error);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code) {
      switch (error.code) {
        case 'ENOTFOUND':
          errorMessage = `Host not found: ${error.hostname}. Please check the host address.`;
          break;
        case 'ECONNREFUSED':
          errorMessage = `Connection refused. Please check if the database server is running and the port is correct.`;
          break;
        case 'ETIMEDOUT':
          errorMessage = `Connection timeout. The database server may be unreachable or overloaded.`;
          break;
        case '28P01':
          errorMessage = `Authentication failed. Please check your username and password.`;
          break;
        case '3D000':
          errorMessage = `Database does not exist. Please check the database name.`;
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