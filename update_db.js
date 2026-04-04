const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;");
    await pool.query("ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0;");
    console.log("DB updated");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
