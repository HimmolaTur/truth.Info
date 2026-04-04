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
    const arrStr = val.map(v => `"${String(v).replace(/"/g, '\\"')}"`).join(',');
    return `'{${arrStr}}'`;
  }
  if (typeof val === 'object') {
    return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  }
  return `'${String(val).replace(/'/g, "''")}'`;
}

async function exportDatabase() {
  try {
    // Часть 1: Только схема (создание таблиц)
    let schemaSql = `-- ЧАСТЬ 1: СХЕМА БАЗЫ ДАННЫХ\n\n`;
    
    // Читаем схему из init_db.sql и schema_updates.sql
    const initDb = fs.readFileSync('init_db.sql', 'utf8');
    const schemaUpdates = fs.readFileSync('schema_updates.sql', 'utf8');
    
    // Берем только CREATE TABLE из файлов
    const initDbSchema = initDb.split('-- Заполнение начальными данными')[0];
    const updatesSchema = schemaUpdates.split('-- Insert initial seed data')[0];
    
    schemaSql += initDbSchema + '\n\n';
    
    // Добавляем таблицы из schema_updates, которых нет в init_db
    if (!initDbSchema.includes('CREATE TABLE IF NOT EXISTS news')) {
       schemaSql += updatesSchema + '\n\n';
    }
    
    schemaSql += `-- Очистка таблиц перед вставкой (на всякий случай)\n`;
    for (const table of [...tables].reverse()) {
      schemaSql += `TRUNCATE TABLE ${table} CASCADE;\n`;
    }
    fs.writeFileSync('dump_part1_schema.sql', schemaSql);

    // Часть 2: Основные данные (пользователи, категории, новости, карта, фактчеки)
    let dataSql1 = `-- ЧАСТЬ 2: ОСНОВНЫЕ ДАННЫЕ\n\n`;
    const tablesPart1 = ['users', 'user_profiles', 'forum_categories', 'news', 'factchecks', 'timeline_events', 'user_stories', 'map_events'];
    for (const table of tablesPart1) {
      const res = await pool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;
      dataSql1 += `-- Данные таблицы ${table}\n`;
      for (const row of res.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(escapeValue).join(', ');
        dataSql1 += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      if (res.rows[0].id !== undefined && typeof res.rows[0].id === 'number') {
        const maxIdRes = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        dataSql1 += `SELECT setval('${table}_id_seq', ${maxIdRes.rows[0].max_id || 0});\n`;
      }
      dataSql1 += '\n';
    }
    fs.writeFileSync('dump_part2_data.sql', dataSql1);

    // Часть 3: Форум (Темы)
    let dataSql2 = `-- ЧАСТЬ 3: ТЕМЫ ФОРУМА\n\n`;
    const tablesPart2 = ['forum_topics', 'forum_polls', 'forum_poll_options', 'forum_poll_votes'];
    for (const table of tablesPart2) {
      const res = await pool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;
      dataSql2 += `-- Данные таблицы ${table}\n`;
      for (const row of res.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(escapeValue).join(', ');
        dataSql2 += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      if (res.rows[0].id !== undefined && typeof res.rows[0].id === 'number') {
        const maxIdRes = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        dataSql2 += `SELECT setval('${table}_id_seq', ${maxIdRes.rows[0].max_id || 0});\n`;
      }
      dataSql2 += '\n';
    }
    fs.writeFileSync('dump_part3_topics.sql', dataSql2);

    // Часть 4: Форум (Комментарии и уведомления)
    let dataSql3 = `-- ЧАСТЬ 4: КОММЕНТАРИИ И УВЕДОМЛЕНИЯ\n\n`;
    const tablesPart3 = ['forum_comments', 'forum_reports', 'forum_notifications', 'forum_subscriptions'];
    for (const table of tablesPart3) {
      const res = await pool.query(`SELECT * FROM ${table}`);
      if (res.rows.length === 0) continue;
      dataSql3 += `-- Данные таблицы ${table}\n`;
      for (const row of res.rows) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(escapeValue).join(', ');
        dataSql3 += `INSERT INTO ${table} (${columns}) VALUES (${values});\n`;
      }
      if (res.rows[0].id !== undefined && typeof res.rows[0].id === 'number') {
        const maxIdRes = await pool.query(`SELECT MAX(id) as max_id FROM ${table}`);
        dataSql3 += `SELECT setval('${table}_id_seq', ${maxIdRes.rows[0].max_id || 0});\n`;
      }
      dataSql3 += '\n';
    }
    fs.writeFileSync('dump_part4_comments.sql', dataSql3);

    console.log('Successfully exported database into 4 parts!');
  } catch (err) {
    console.error('Export error:', err);
  } finally {
    pool.end();
  }
}

exportDatabase();
