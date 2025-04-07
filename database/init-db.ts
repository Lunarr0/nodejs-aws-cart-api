import * as fs from 'fs';
import * as path from 'path';
import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

async function initDB() {
  // Ensure all necessary environment variables are defined
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
  const user = process.env.DB_USER;
  const password = process.env.DB_PASS;
  const database = process.env.DB_NAME;

  // Validate the presence of critical environment variables
  if (!host || !user || !password || !database) {
    console.error('Missing required environment variables.');
    process.exit(1);
  }

  // Create a new PostgreSQL client with SSL support
  const client = new Client({
    host,
    port,
    user,
    password,
    database,
    ssl: {
      rejectUnauthorized: false // Adjust according to your SSL requirement
    },
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully');

    // Read and execute the SQL script
    const sqlScriptPath = path.join(__dirname, 'init-db.sql');
    if (fs.existsSync(sqlScriptPath)) {
      const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
      console.log('Executing SQL script...');
      await client.query(sqlScript);
      console.log('Database initialized successfully');
    } else {
      console.error(`SQL script not found at path: ${sqlScriptPath}`);
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
    // Provide more context about the error if needed
    if (error.code === '28000') {
      console.error('Authentication failed: Check your username and password.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the initialization function
initDB();
