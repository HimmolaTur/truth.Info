const { Client } = require('pg');

async function updateImages() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'hacaton',
    password: 'postgres',
    port: 5432,
  });

  try {
    await client.connect();
    
    // Добавляем колонку, если ее нет
    await client.query('ALTER TABLE news ADD COLUMN IF NOT EXISTS image_url TEXT;');
    
    // Обновляем существующие новости красивыми картинками
    await client.query(`
      UPDATE news SET image_url = 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=1000&auto=format&fit=crop' WHERE id = 1;
      UPDATE news SET image_url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1000&auto=format&fit=crop' WHERE id = 2;
      UPDATE news SET image_url = 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?q=80&w=1000&auto=format&fit=crop' WHERE id = 3;
    `);
    
    console.log('Images added successfully!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

updateImages();