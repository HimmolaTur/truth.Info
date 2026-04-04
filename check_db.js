const { Pool } = require('pg');
const pool = new Pool({ user: 'postgres', host: 'localhost', database: 'hacaton', password: 'postgres', port: 5432 });
pool.query("SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_name LIKE 'forum_%';")
  .then(res => { console.log(res.rows); pool.end(); })
  .catch(err => { console.error(err); pool.end(); });
