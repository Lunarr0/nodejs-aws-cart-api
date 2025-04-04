"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const pg_1 = require("pg");
const dotenv = require("dotenv");
dotenv.config();
async function initDB() {
    const host = process.env.DB_HOST;
    const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASS;
    const database = process.env.DB_NAME;
    if (!host || !user || !password || !database) {
        console.error('Missing required environment variables.');
        process.exit(1);
    }
    const client = new pg_1.Client({
        host,
        port,
        user,
        password,
        database,
        ssl: {
            rejectUnauthorized: false
        },
    });
    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected successfully');
        const sqlScriptPath = path.join(__dirname, 'init-db.sql');
        if (fs.existsSync(sqlScriptPath)) {
            const sqlScript = fs.readFileSync(sqlScriptPath, 'utf8');
            console.log('Executing SQL script...');
            await client.query(sqlScript);
            console.log('Database initialized successfully');
        }
        else {
            console.error(`SQL script not found at path: ${sqlScriptPath}`);
        }
    }
    catch (error) {
        console.error('Error initializing database:', error.message);
        if (error.code === '28000') {
            console.error('Authentication failed: Check your username and password.');
        }
        process.exit(1);
    }
    finally {
        await client.end();
    }
}
initDB();
//# sourceMappingURL=init-db.js.map