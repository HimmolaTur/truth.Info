const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, topic_id)
      );
    `);
    await pool.query("ALTER TABLE forum_notifications ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;");
    await pool.query("ALTER TABLE forum_notifications ALTER COLUMN session_id DROP NOT NULL;");
    console.log("DB updated for subscriptions");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
