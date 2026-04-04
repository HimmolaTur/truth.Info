const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS forum_polls (
        id SERIAL PRIMARY KEY,
        topic_id INTEGER REFERENCES forum_topics(id) ON DELETE CASCADE,
        question TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS forum_poll_options (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES forum_polls(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        votes INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS forum_poll_votes (
        id SERIAL PRIMARY KEY,
        poll_id INTEGER REFERENCES forum_polls(id) ON DELETE CASCADE,
        option_id INTEGER REFERENCES forum_poll_options(id) ON DELETE CASCADE,
        session_id TEXT NOT NULL,
        UNIQUE(poll_id, session_id)
      );
      
      ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `);
    console.log("DB updated for polls and online status");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
