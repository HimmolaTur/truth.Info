const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        avatar_url VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;");
    await pool.query("ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;");
    
    console.log("DB updated for user authentication");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
