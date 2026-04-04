const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setup() {
  // 1. Connect to the default 'postgres' database to create the new one
  const clientDefault = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
  });

  try {
    await clientDefault.connect();
    console.log('Connected to default postgres database.');
    
    // Check if database exists
    const res = await clientDefault.query("SELECT 1 FROM pg_database WHERE datname = 'hacaton'");
    if (res.rowCount === 0) {
      console.log('Creating database hacaton...');
      await clientDefault.query('CREATE DATABASE hacaton');
      console.log('Database hacaton created successfully.');
    } else {
      console.log('Database hacaton already exists.');
    }
  } catch (err) {
    console.error('Error creating database:', err.message);
    console.log('Please check if your PostgreSQL password is "postgres". If not, update it in .env.local and run this script again.');
    process.exit(1);
  } finally {
    await clientDefault.end();
  }

  // 2. Connect to the new 'hacaton' database to run the schema
  const clientApp = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hacaton',
    password: 'postgres',
    port: 5432,
  });

  try {
    await clientApp.connect();
    console.log('Connected to hacaton database.');
    
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    console.log('Running schema.sql...');
    await clientApp.query(schemaSql);
    console.log('Schema created and initial data inserted successfully!');
  } catch (err) {
    console.error('Error running schema:', err.message);
  } finally {
    await clientApp.end();
  }
}

setup();