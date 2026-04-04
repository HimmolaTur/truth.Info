const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS is_closed BOOLEAN DEFAULT false;");
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS tags TEXT[];");
    await pool.query("ALTER TABLE forum_comments ADD COLUMN IF NOT EXISTS parent_id INTEGER REFERENCES forum_comments(id) ON DELETE CASCADE;");
    console.log("DB updated for advanced forum features");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
