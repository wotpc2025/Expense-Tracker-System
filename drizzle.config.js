import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

// Drizzle CLI config used by commands like:
// - npx drizzle-kit push
// - npx drizzle-kit generate
// - npx drizzle-kit studio

// Load environment variables from .env.local for local schema/migration commands.
dotenv.config({
  path: ".env.local",
});

// Resolve DB credentials with this priority:
// 1) DATABASE_URL (single connection string)
// 2) DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (discrete values)
const getDbCredentials = () => {
  const databaseUrl = String(process.env.DATABASE_URL || '').trim();

  if (databaseUrl) {
    // URL parsing keeps credentials handling consistent between local and CI.
    const parsedUrl = new URL(databaseUrl);

    return {
      host: parsedUrl.hostname,
      port: parsedUrl.port ? Number(parsedUrl.port) : 3306,
      user: decodeURIComponent(parsedUrl.username || ''),
      password: decodeURIComponent(parsedUrl.password || ''),
      database: parsedUrl.pathname.replace(/^\//, ''),
    };
  }

  return {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
  };
};

export default defineConfig({
  // Database dialect used by Drizzle.
  dialect: "mysql", 

  // Path to schema definitions.
  schema: "./utils/schema.jsx", 

  // Output directory for generated migrations.
  out: "./drizzle",

  // Connection details resolved from DATABASE_URL or DB_* fallback.
  // This keeps one config file usable across dev machines and deployment nodes.
  dbCredentials: getDbCredentials(),
});