import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
// @ts-ignore
import EmbeddedPostgres from 'embedded-postgres';
// @ts-ignore
import { Client } from 'pg';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const dbPath = path.resolve(__dirname, '../.db-data');
const dbUrl = process.env.DATABASE_URL || '';
const portMatch = dbUrl.match(/:(\d+)\//);
const port = portMatch ? parseInt(portMatch[1], 10) : 5433;

async function start() {
  console.log(`Starting Embedded PostgreSQL on port ${port}...`);
  console.log(`Data directory: ${dbPath}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dbPath,
    port: port,
    user: 'postgres',
    password: 'postgrespassword',
    persistent: true,
  });

  const isInitialized = fs.existsSync(path.join(dbPath, 'PG_VERSION'));
  if (!isInitialized) {
    console.log('Initializing database cluster...');
    await pg.initialise();
  } else {
    console.log('Database cluster already initialized.');
  }

  await pg.start();

  // Set password for postgres superuser to match DATABASE_URL
  try {
    const client = new Client({
      host: 'localhost',
      port,
      user: 'postgres',
      database: 'postgres',
    });
    await client.connect();
    await client.query("ALTER USER postgres WITH PASSWORD 'postgrespassword';");
    await client.end();
    console.log('PostgreSQL superuser password updated.');
  } catch (err: any) {
    console.log('Notice configuring postgres password:', err.message);
  }

  // Create database if not exists
  try {
    await pg.createDatabase('swapwear_db');
    console.log('Database "swapwear_db" ready.');
  } catch (err: any) {
    if (err.message && err.message.includes('already exists')) {
      console.log('Database "swapwear_db" already exists.');
    } else {
      console.log('Database notice:', err.message);
    }
  }

  console.log(`PostgreSQL is running at postgresql://postgres:postgrespassword@localhost:${port}/swapwear_db`);
  console.log('Press Ctrl+C to stop.');

  process.on('SIGINT', async () => {
    console.log('Stopping PostgreSQL...');
    await pg.stop();
    process.exit(0);
  });
}

start().catch((err) => {
  console.error('Failed to start embedded PostgreSQL:', err);
  process.exit(1);
});
