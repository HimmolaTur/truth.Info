const { Pool } = require('pg');
const crypto = require('crypto');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });

async function updateDb() {
  try {
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name VARCHAR(100);");
    
    const res = await pool.query("SELECT id, username FROM users WHERE display_name IS NULL");
    for (const row of res.rows) {
      const hash = crypto.createHash('sha256').update(row.username + 'secret-salt').digest('hex').substring(0, 10);
      const display_name = `Anon_${hash}`;
      await pool.query("UPDATE users SET display_name = $1 WHERE id = $2", [display_name, row.id]);
    }
    
    console.log("DB updated for display_name");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
updateDb();
