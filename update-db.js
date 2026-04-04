const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runUpdates() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hacaton',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    console.log('Connected to hacaton database.');
    
    const sql = fs.readFileSync(path.join(__dirname, 'schema_updates.sql'), 'utf8');
    await client.query(sql);
    console.log('Tables created and seeded successfully!');
  } catch (err) {
    console.error('Error running schema updates:', err.message);
  } finally {
    await client.end();
  }
}

runUpdates();