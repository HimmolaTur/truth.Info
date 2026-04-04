const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;");
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_reports (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        comment_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE,
        reporter_session_id TEXT,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_profiles (
        session_id TEXT PRIMARY KEY,
        karma INTEGER DEFAULT 0,
        last_post_at TIMESTAMP
      );
    `);
    
    console.log("DB updated for advanced features");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
