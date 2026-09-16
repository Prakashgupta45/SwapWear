import path from 'path';
// @ts-ignore
import EmbeddedPostgres from 'embedded-postgres';

const dbPath = path.resolve(__dirname, '../.db-data');
const port = 5432;

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

  await pg.initialise();
  await pg.start();

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
