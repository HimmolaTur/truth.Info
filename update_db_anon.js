const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS author_session_id TEXT;");
    await pool.query("ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS author_session_id TEXT;");
    console.log("DB updated for anonymous sessions");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
