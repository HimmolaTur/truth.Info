import { Pool } from 'pg';

const poolConfig =
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false,
        },
      }
    : {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'hacaton',
        password: process.env.DB_PASSWORD || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432', 10),
      };

const pool = new Pool({
  ...poolConfig,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 15_000,
  // true закрывает пул после простоя — в Next.js dev/prod следующий query может зависнуть или не отработать
  allowExitOnIdle: false,
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

/** Fails fast if Supabase/network hangs (does not cancel query on the server). */
export function queryWithTimeout(text: string, params?: unknown[], ms = 25_000) {
  return Promise.race([
    pool.query(text, params),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Database timeout after ${ms}ms`)), ms)
    ),
  ]);
}