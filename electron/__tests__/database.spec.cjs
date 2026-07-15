const fs = require("fs");
const os = require("os");
const path = require("path");
const Database = require("better-sqlite3");
const { initializeDatabase } = require("../database.cjs");

const migrationsPath = path.resolve(__dirname, "../../prisma/migrations");

function migrationCount(databasePath) {
  const database = new Database(databasePath);
  const count = database
    .prepare("SELECT COUNT(*) AS count FROM _game_backlog_tracker_migrations")
    .get().count;
  database.close();
  return count;
}

describe("packaged database migrations", () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "game-backlog-migrations-"));
  });

  afterEach(() => {
    fs.rmSync(directory, { force: true, recursive: true });
  });

  it("initializes a fresh database and records all applied migrations", () => {
    const databasePath = path.join(directory, "app.db");

    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    expect(migrationCount(databasePath)).toBe(3);
  });

  it("baselines databases created before migration tracking", () => {
    const databasePath = path.join(directory, "app.db");
    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    const database = new Database(databasePath);
    database.exec("DROP TABLE _game_backlog_tracker_migrations");
    database.close();

    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    expect(migrationCount(databasePath)).toBe(3);
  });

  it("restores a pre-migration snapshot when a future migration fails", () => {
    const databasePath = path.join(directory, "app.db");
    const backupsPath = path.join(directory, "backups");
    initializeDatabase(databasePath, migrationsPath, backupsPath);

    const failingMigrationsPath = path.join(directory, "migrations");
    fs.cpSync(migrationsPath, failingMigrationsPath, { recursive: true });
    const failingMigrationPath = path.join(
      failingMigrationsPath,
      "20260716000000_failing_update"
    );
    fs.mkdirSync(failingMigrationPath);
    fs.writeFileSync(
      path.join(failingMigrationPath, "migration.sql"),
      'CREATE TABLE "TemporaryUpdate" (id TEXT PRIMARY KEY);\nTHIS IS NOT SQL;\n'
    );

    expect(() =>
      initializeDatabase(databasePath, failingMigrationsPath, backupsPath)
    ).toThrow(/original data was restored/);
    expect(migrationCount(databasePath)).toBe(3);
    expect(fs.readdirSync(backupsPath)).toContainEqual(
      expect.stringMatching(/^pre-migration-.*\.db$/)
    );

    const database = new Database(databasePath);
    expect(
      database
        .prepare(
          "SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'TemporaryUpdate'"
        )
        .get()
    ).toBeUndefined();
    database.close();
  });
});
