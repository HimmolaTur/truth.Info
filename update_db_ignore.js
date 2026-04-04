const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS ignored_sessions TEXT[] DEFAULT '{}';");
    console.log("DB updated for ignore list");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
