const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: "postgresql://postgres.fsfiegnvwhvllpnvrflz:5Mm7vY9J9uYsWeWP@aws-0-eu-west-1.pooler.supabase.com:6543/postgres",
  ssl: { rejectUnauthorized: false },
  max: 5, // Небольшой пул
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

async function runMigration() {
  try {
    console.log("Connecting to Supabase Pooler...");

    const files = [
      'dump_part1_schema.sql',
      'dump_part2_data.sql',
      'dump_part3_topics.sql',
      'dump_part4_comments.sql'
    ];

    for (const file of files) {
      console.log(`\n--- Processing ${file} ---`);
      const content = fs.readFileSync(file, 'utf8');
      
      // Разбиваем файл на отдельные запросы
      const statements = content.split(/;\n+/);
      
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        let stmt = statements[i].trim();
        if (!stmt || (stmt.startsWith('--') && stmt.split('\n').length === 1)) {
          continue;
        }
        
        // Убираем комментарии из начала запроса, так как пулер может на них ругаться
        stmt = stmt.replace(/^--.*\n/gm, '').trim();
        if (!stmt) continue;

        let retries = 3;
        while (retries > 0) {
          try {
            await pool.query(stmt);
            successCount++;
            if (successCount % 10 === 0) {
              console.log(`Executed ${successCount} statements...`);
            }
            break; // Успешно выполнено
          } catch (err) {
            if (err.code === 'ECONNRESET' || err.message.includes('Connection terminated')) {
              console.log(`Connection reset, retrying... (${retries} left)`);
              retries--;
              await new Promise(resolve => setTimeout(resolve, 2000)); // Ждем 2 сек
            } else {
              errorCount++;
              console.error(`\n❌ Error executing statement: ${err.message}`);
              console.error(`Snippet: ${stmt.substring(0, 100)}...`);
              break; // Ошибка в самом SQL, не повторяем
            }
          }
        }
      }
      console.log(`✅ Finished ${file}. Success: ${successCount}, Errors: ${errorCount}`);
    }

    console.log("\n🎉 All data successfully migrated to Supabase!");
  } catch (err) {
    console.error("❌ Fatal error:", err);
  } finally {
    await pool.end();
  }
}

runMigration();
