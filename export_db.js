const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'hacaton',
  password: 'postgres',
  port: 5432,
});

const tables = [
  'users',
  'user_profiles',
  'forum_categories',
  'forum_topics',
  'forum_comments',
  'forum_polls',
  'forum_poll_options',
  'forum_poll_votes',
  'forum_reports',
  'forum_notifications',
  'forum_subscriptions',
  'news',
  'factchecks',
  'timeline_events',
  'user_stories',
  'map_events'
];

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val;
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Array.isArray(val)) {
    // Handle array of strings
    const arrStr = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'{${arrStr}}'`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  // String
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportDatabase() {
  try {
    let sql = `-- Полный дамп базы данных (Схема + Данные)\n\n`;

    // 1. Читаем схему из init_db.sql
    const schema = fs.readFileSync('init_db.sql', 'utf8');
    // Убираем INSERT'ы из схемы, чтобы не было дублей
    const schemaWithoutInserts = schema.split('-- Заполнение начальными данными')[0].split('-- 12. Добавляем базовые категории')[0];
    
    sql += schemaWithoutInserts + '\n\n';
    sql += `-- Очистка таблиц перед вставкой (на всякий случай)\n`;
    
    for (const table of [...tables].reverse()) {
      sql += `TRUNCATE TABLE ${table} CASCADE;\n`;
    }
    sql += '\n';

    // 2. Экспортируем данные
    for (const table of tables) {
      console.log(`Exporting table: ${table}...`);
      const res = await pool.query(`SELECT * FROM ${table}`);
      
      if (res.rows.length === 0) continue;

      sql += `-- Данные таблицы ${table}\n`;
      
      for (const row of res.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(escapeValue).join(', ');
        sql += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      
      // Обновляем sequence (счетчик ID), если есть колонка id
      if (res.rows[0].id !== undefined && typeof res.rows[0].id === 'number') {
        const maxIdRes = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        const maxId = maxIdRes.rows[0].max_id || 0;
        sql += `SELECT setval('${table}_id_seq', ${maxId});\n`;
      }
      
      sql += '\n';
    }

    fs.writeFileSync('full_dump.sql', sql);
    console.log('Successfully exported to full_dump.sql');
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    pool.end();
  }
}

exportDatabase();
