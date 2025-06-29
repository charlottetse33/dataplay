Deno.serve(async (req) => {
  try {
    const { connectionData, sqlCode } = await req.json();
    
    console.log('Executing SQL for database type:', connectionData.database_type);
    
    let result;
    
    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        result = await executePostgreSQL(connectionData, sqlCode);
        break;
      case 'mysql':
        result = await executeMySQL(connectionData, sqlCode);
        break;
      case 'sqlite':
        result = await executeSQLite(connectionData, sqlCode);
        break;
      case 'mongodb':
        throw new Error('SQL execution not supported for MongoDB. Use MongoDB-specific operations.');
      case 'mssql':
      case 'sqlserver':
        result = await executeSQLServer(connectionData, sqlCode);
        break;
      default:
        throw new Error(`Unsupported database type: ${connectionData.database_type}`);
    }

    return new Response(JSON.stringify({
      success: true,
      result: result.message,
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

async function executePostgreSQL(connectionData: any, sqlCode: string) {
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
  const result = await client.query(sqlCode);
  await client.end();

  return {
    message: `SQL executed successfully. Rows affected: ${result.rowCount || 0}`,
    rowCount: result.rowCount
  };
}

async function executeMySQL(connectionData: any, sqlCode: string) {
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
      
      connection.query(sqlCode, (err, results) => {
        connection.end();
        
        if (err) {
          reject(err);
          return;
        }
        
        const rowCount = results.affectedRows || results.changedRows || 0;
        resolve({
          message: `SQL executed successfully. Rows affected: ${rowCount}`,
          rowCount
        });
      });
    });
  });
}

async function executeSQLite(connectionData: any, sqlCode: string) {
  const Database = await import("npm:better-sqlite3@9.2.2");
  
  const db = new Database.default(connectionData.database);
  
  try {
    const stmt = db.prepare(sqlCode);
    const result = stmt.run();
    db.close();
    
    return {
      message: `SQL executed successfully. Rows affected: ${result.changes || 0}`,
      rowCount: result.changes
    };
  } catch (error) {
    db.close();
    throw error;
  }
}

async function executeSQLServer(connectionData: any, sqlCode: string) {
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
  const result = await pool.request().query(sqlCode);
  await pool.close();
  
  return {
    message: `SQL executed successfully. Rows affected: ${result.rowsAffected?.[0] || 0}`,
    rowCount: result.rowsAffected?.[0]
  };
}