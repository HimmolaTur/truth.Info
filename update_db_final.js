const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS is_best_answer BOOLEAN DEFAULT false;");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_notifications (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("DB updated for best answers and notifications");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
