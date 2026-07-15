const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

function migrationDirectories(migrationsPath) {
  return fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function initializeDatabase(databasePath, migrationsPath) {
  if (fs.existsSync(databasePath)) return;

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);

  try {
    for (const migration of migrationDirectories(migrationsPath)) {
      const sql = fs.readFileSync(
        path.join(migrationsPath, migration, "migration.sql"),
        "utf8"
      );
      database.exec(sql);
    }
  } catch (error) {
    database.close();
    fs.rmSync(databasePath, { force: true });
    throw error;
  }

  database.close();
}

const [databasePath, migrationsPath] = process.argv.slice(2);

if (!databasePath || !migrationsPath) {
  throw new Error("Database path and migrations path are required.");
}

initializeDatabase(databasePath, migrationsPath);
