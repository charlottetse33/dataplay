Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Testing connection to:', {
      database_type: connectionData.database_type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      username: connectionData.username
    });
    
    let result;
    
    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres':
        result = await testPostgreSQL(connectionData);
        break;
      case 'mysql':
        result = await testMySQL(connectionData);
        break;
      case 'sqlite':
        result = await testSQLite(connectionData);
        break;
      case 'mongodb':
        result = await testMongoDB(connectionData);
        break;
      case 'mssql':
      case 'sqlserver':
        result = await testSQLServer(connectionData);
        break;
      default:
        throw new Error(`Unsupported database type: ${connectionData.database_type}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful",
      details: result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database connection error:', error);
    
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

async function testPostgreSQL(connectionData: any) {
  const { Client } = await import("npm:pg@8.11.3");
  
  const client = new Client({
    host: connectionData.host,
    port: connectionData.port,
    database: connectionData.database,
    user: connectionData.username,
    password: connectionData.password,
    ssl: connectionData.ssl_mode !== 'disable' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 10000,
    query_timeout: 5000,
  });

  await client.connect();
  const result = await client.query('SELECT current_database() as database, current_user as username, version() as version');
  await client.end();
  
  return {
    database: result.rows[0].database,
    user: result.rows[0].username,
    version: result.rows[0].version,
    type: 'PostgreSQL'
  };
}

async function testMySQL(connectionData: any) {
  const mysql = await import("npm:mysql2@3.6.5");
  
  const connection = mysql.createConnection({
    host: connectionData.host,
    port: connectionData.port,
    user: connectionData.username,
    password: connectionData.password,
    database: connectionData.database,
    ssl: connectionData.ssl_mode !== 'disable' ? {} : false,
    connectTimeout: 10000,
    acquireTimeout: 10000,
  });

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        reject(err);
        return;
      }
      
      connection.query('SELECT DATABASE() as database, USER() as user, VERSION() as version', (err, results) => {
        connection.end();
        
        if (err) {
          reject(err);
          return;
        }
        
        resolve({
          database: results[0].database,
          user: results[0].user,
          version: results[0].version,
          type: 'MySQL'
        });
      });
    });
  });
}

async function testSQLite(connectionData: any) {
  const Database = await import("npm:better-sqlite3@9.2.2");
  
  const db = new Database.default(connectionData.database);
  const result = db.prepare('SELECT sqlite_version() as version').get();
  db.close();
  
  return {
    database: connectionData.database,
    version: result.version,
    type: 'SQLite'
  };
}

async function testMongoDB(connectionData: any) {
  const { MongoClient } = await import("npm:mongodb@6.3.0");
  
  const uri = connectionData.connection_string || 
    `mongodb://${connectionData.username}:${connectionData.password}@${connectionData.host}:${connectionData.port}/${connectionData.database}`;
  
  const client = new MongoClient(uri, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  
  await client.connect();
  const admin = client.db().admin();
  const result = await admin.buildInfo();
  await client.close();
  
  return {
    database: connectionData.database,
    version: result.version,
    type: 'MongoDB'
  };
}

async function testSQLServer(connectionData: any) {
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
      connectTimeout: 10000,
      requestTimeout: 5000,
    }
  };
  
  const pool = await sql.connect(config);
  const result = await pool.request().query('SELECT DB_NAME() as database, SUSER_NAME() as username, @@VERSION as version');
  await pool.close();
  
  return {
    database: result.recordset[0].database,
    user: result.recordset[0].username,
    version: result.recordset[0].version,
    type: 'SQL Server'
  };
}