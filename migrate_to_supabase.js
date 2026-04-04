const { Pool } = require('pg');
const fs = require('fs');

// Подключаемся к удаленной базе Supabase (используем прямой порт 5432 для миграции, так как pooler может резать длинные транзакции)
const pool = new Pool({
  connectionString: "postgresql://postgres.fsfiegnvwhvllpnvrflz:5Mm7vY9J9uYsWeWP@aws-0-eu-west-1.pooler.supabase.com:5432/postgres",
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  try {
    console.log("Connecting to Supabase...");
    
    // 1. Выполняем схему
    console.log("Running Part 1 (Schema)...");
    const part1 = fs.readFileSync('dump_part1_schema.sql', 'utf8');
    const safePart1 = part1.split('-- Очистка таблиц')[0];
    await pool.query(safePart1);
    
    // 2. Выполняем данные
    console.log("Running Part 2 (Data)...");
    const part2 = fs.readFileSync('dump_part2_data.sql', 'utf8');
    await pool.query(part2);
    
    // 3. Выполняем темы
    console.log("Running Part 3 (Topics)...");
    const part3 = fs.readFileSync('dump_part3_topics.sql', 'utf8');
    await pool.query(part3);
    
    // 4. Выполняем комментарии
    console.log("Running Part 4 (Comments)...");
    const part4 = fs.readFileSync('dump_part4_comments.sql', 'utf8');
    await pool.query(part4);

    console.log("✅ Successfully migrated all data to Supabase!");
  } catch (err) {
    console.error("❌ Migration failed:", err.message);
  } finally {
    pool.end();
  }
}

runMigration();
