Deno.serve(async (req) => {
  try {
    const { connectionData } = await req.json();
    
    console.log('Testing connection to:', {
      type: connectionData.database_type,
      host: connectionData.host,
      port: connectionData.port,
      database: connectionData.database,
      username: connectionData.username
    });

    let client;
    let result;

    switch (connectionData.database_type.toLowerCase()) {
      case 'postgresql':
      case 'postgres': {
        const { Client } = await import("npm:pg@8.11.3");
        client = new Client({
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
        result = await client.query('SELECT current_database() as db_name, current_user as username, version() as version');
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
          connectTimeout: 10000,
        });
        
        await new Promise((resolve, reject) => {
          connection.connect((err) => {
            if (err) reject(err);
            else resolve(null);
          });
        });

        result = await new Promise((resolve, reject) => {
          connection.query('SELECT DATABASE() as db_name, USER() as username, VERSION() as version', (err, results) => {
            if (err) reject(err);
            else resolve({ rows: results });
          });
        });
        
        connection.end();
        break;
      }

      case 'sqlite': {
        const { Database } = await import("npm:sqlite3@5.1.6");
        const db = new Database(connectionData.database);
        
        result = await new Promise((resolve, reject) => {
          db.get('SELECT sqlite_version() as version', (err, row) => {
            if (err) reject(err);
            else resolve({ rows: [{ db_name: connectionData.database, username: 'local', version: row.version }] });
          });
        });
        
        db.close();
        break;
      }

      case 'mongodb': {
        const { MongoClient } = await import("npm:mongodb@6.3.0");
        const uri = connectionData.connection_string || 
          `mongodb://${connectionData.username}:${connectionData.password}@${connectionData.host}:${connectionData.port}/${connectionData.database}`;
        
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 10000 });
        await client.connect();
        
        const admin = client.db().admin();
        const serverStatus = await admin.serverStatus();
        
        result = {
          rows: [{
            db_name: connectionData.database,
            username: connectionData.username,
            version: serverStatus.version
          }]
        };
        
        await client.close();
        break;
      }

      case 'redis': {
        const redis = await import("npm:redis@4.6.12");
        client = redis.createClient({
          url: connectionData.connection_string || `redis://${connectionData.host}:${connectionData.port}`,
          password: connectionData.password,
          connectTimeout: 10000,
        });
        
        await client.connect();
        const info = await client.info('server');
        const version = info.match(/redis_version:([^\r\n]+)/)?.[1] || 'unknown';
        
        result = {
          rows: [{
            db_name: connectionData.database || '0',
            username: connectionData.username || 'default',
            version: version
          }]
        };
        
        await client.quit();
        break;
      }

      default:
        throw new Error(`Unsupported database type: ${connectionData.database_type}`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Connection successful",
      details: {
        database: result.rows[0].db_name,
        user: result.rows[0].username,
        version: result.rows[0].version,
        type: connectionData.database_type
      }
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('Database connection error:', error);
    
    let errorMessage = error.message;
    if (error.code) {
      switch (error.code) {
        case 'ENOTFOUND':
          errorMessage = `Host not found. Please check the host address.`;
          break;
        case 'ECONNREFUSED':
          errorMessage = `Connection refused. Please check if the database server is running and the port is correct.`;
          break;
        case 'ETIMEDOUT':
          errorMessage = `Connection timeout. The database server may be unreachable.`;
          break;
        case 'ER_ACCESS_DENIED_ERROR':
        case '28P01':
          errorMessage = `Authentication failed. Please check your username and password.`;
          break;
        case 'ER_BAD_DB_ERROR':
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