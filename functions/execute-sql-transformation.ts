Deno.serve(async (req) => {
  try {
    const { connectionData, sqlCode } = await req.json();
    
    console.log('Executing SQL for:', connectionData.database_type);
    console.log('SQL:', sqlCode);

    let result;

    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres': {
        const { Client } = await import("npm:pg@8.11.3");
        const client = new Client({
          host: connectionData.host,
          port: connectionData.port,
          database: connectionData.database,
          user: connectionData.username,
          password: connectionData.password,
          ssl: connectionData.ssl_mode !== 'disable' ? { rejectUnauthorized: false } : false,
        });

        await client.connect();
        result = await client.query(sqlCode);
        await client.end();
        break;
      }

      case 'mysql': {
        const mysql = await import("npm:mysql2@3.6.5");
        const connection = mysql.createConnection({
          host: connectionData.host,
          port: connectionData.port,
          user: connectionData.username,
          password: connectionData.password,
          database: connectionData.database,
          ssl: connectionData.ssl_mode !== 'disable',
          multipleStatements: true,
        });

        result = await new Promise((resolve, reject) => {
          connection.query(sqlCode, (err, results) => {
            if (err) reject(err);
            else resolve({ rowCount: results.affectedRows || 0 });
          });
        });

        connection.end();
        break;
      }

      case 'sqlite': {
        const { Database } = await import("npm:sqlite3@5.1.6");
        const db = new Database(connectionData.database);

        result = await new Promise((resolve, reject) => {
          db.run(sqlCode, function(err) {
            if (err) reject(err);
            else resolve({ rowCount: this.changes || 0 });
          });
        });

        db.close();
        break;
      }

      default:
        throw new Error(`SQL execution not supported for: ${connectionData.database_type}`);
    }

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