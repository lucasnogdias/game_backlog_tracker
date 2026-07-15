const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");

const MIGRATION_TABLE = "_game_backlog_tracker_migrations";
const LEGACY_MIGRATIONS = [
  "20260703152549_init",
  "20260703153531_add_user_and_relations",
  "20260713112453_add_journal_entries",
];

class MigrationError extends Error {
  constructor(message, backupPath) {
    super(message);
    this.backupPath = backupPath;
  }
}

function migrationDirectories(migrationsPath) {
  return fs
    .readdirSync(migrationsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function createMigrationTable(database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS "${MIGRATION_TABLE}" (
      migrationName TEXT NOT NULL PRIMARY KEY,
      appliedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function hasMigrationTable(database) {
  return Boolean(
    database
      .prepare(
        "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1"
      )
      .get(MIGRATION_TABLE)
  );
}

function hasLegacySchema(database) {
  const tables = new Set(
    database
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((row) => row.name)
  );
  return ["User", "BacklogGame", "HistoryEntry", "JournalEntry"].every((table) =>
    tables.has(table)
  );
}

function appliedMigrations(database) {
  return new Set(
    database
      .prepare(`SELECT migrationName FROM "${MIGRATION_TABLE}"`)
      .all()
      .map((row) => row.migrationName)
  );
}

function baselineLegacyMigrations(database, migrations) {
  if (!hasLegacySchema(database)) {
    throw new MigrationError(
      "The existing database does not match a supported version and was not changed."
    );
  }

  const missingLegacyMigration = LEGACY_MIGRATIONS.find(
    (migration) => !migrations.includes(migration)
  );
  if (missingLegacyMigration) {
    throw new MigrationError(
      `The packaged app is missing the legacy migration "${missingLegacyMigration}".`
    );
  }

  createMigrationTable(database);
  const insert = database.prepare(
    `INSERT OR IGNORE INTO "${MIGRATION_TABLE}" (migrationName) VALUES (?)`
  );
  const baseline = database.transaction(() => {
    for (const migration of LEGACY_MIGRATIONS) insert.run(migration);
  });
  baseline();
}

function createBackup(database, databasePath, backupsPath) {
  database.pragma("wal_checkpoint(TRUNCATE)");
  fs.mkdirSync(backupsPath, { recursive: true });
  const backupPath = path.join(
    backupsPath,
    `pre-migration-${timestamp()}.db`
  );
  fs.copyFileSync(databasePath, backupPath);
  return backupPath;
}

function restoreBackup(databasePath, backupPath) {
  if (!backupPath) return;
  fs.copyFileSync(backupPath, databasePath);
}

function applyMigration(database, migrationPath, migrationName) {
  const sql = fs.readFileSync(path.join(migrationPath, "migration.sql"), "utf8");
  const apply = database.transaction(() => {
    database.exec(sql);
    database
      .prepare(
        `INSERT INTO "${MIGRATION_TABLE}" (migrationName) VALUES (?)`
      )
      .run(migrationName);
  });
  apply();
}

function initializeDatabase(databasePath, migrationsPath, backupsPath) {
  const isNewDatabase = !fs.existsSync(databasePath);
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  const database = new Database(databasePath);
  let backupPath;

  try {
    const migrations = migrationDirectories(migrationsPath);
    if (!hasMigrationTable(database)) {
      if (isNewDatabase) {
        createMigrationTable(database);
      } else {
        baselineLegacyMigrations(database, migrations);
      }
    }

    const applied = appliedMigrations(database);
    const pending = migrations.filter((migration) => !applied.has(migration));
    if (pending.length === 0) {
      database.close();
      return;
    }

    if (!isNewDatabase) {
      backupPath = createBackup(database, databasePath, backupsPath);
    }

    for (const migration of pending) {
      applyMigration(database, path.join(migrationsPath, migration), migration);
    }
    database.close();
  } catch (error) {
    database.close();
    if (backupPath) {
      restoreBackup(databasePath, backupPath);
      throw new MigrationError(
        `Database migration failed. Your original data was restored from "${backupPath}".`,
        backupPath
      );
    }
    if (isNewDatabase) fs.rmSync(databasePath, { force: true });
    throw error;
  }
}

if (require.main === module) {
  const [databasePath, migrationsPath, backupsPath] = process.argv.slice(2);

  if (!databasePath || !migrationsPath || !backupsPath) {
    throw new Error("Database, migrations, and backups paths are required.");
  }

  try {
    initializeDatabase(databasePath, migrationsPath, backupsPath);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown database migration error.";
    console.error(message);
    process.exitCode = 1;
  }
}

module.exports = { initializeDatabase };
