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

    expect(migrationCount(databasePath)).toBe(6);
  });

  it("baselines databases created before migration tracking", () => {
    const databasePath = path.join(directory, "app.db");
    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    const database = new Database(databasePath);
    database.exec("DROP TABLE _game_backlog_tracker_migrations");
    database.close();

    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    expect(migrationCount(databasePath)).toBe(6);
  });

  it("preserves user-owned games when making passwords optional", () => {
    const databasePath = path.join(directory, "app.db");
    const oldMigrationsPath = path.join(directory, "old-migrations");
    fs.cpSync(migrationsPath, oldMigrationsPath, { recursive: true });
    fs.rmSync(
      path.join(oldMigrationsPath, "20260824162900_make_account_password_optional"),
      { recursive: true }
    );
    initializeDatabase(databasePath, oldMigrationsPath, path.join(directory, "backups"));

    const database = new Database(databasePath);
    database
      .prepare(
        'INSERT INTO "User" (id, username, passwordHash, role, updatedAt) VALUES (?, ?, ?, ?, ?)'
      )
      .run("user-1", "existing-user", "password-hash", "admin", new Date().toISOString());
    database
      .prepare(
        'INSERT INTO "BacklogGame" (id, userId, title, platforms, updatedAt) VALUES (?, ?, ?, ?, ?)'
      )
      .run("game-1", "user-1", "Existing game", "[]", new Date().toISOString());
    database.close();

    initializeDatabase(databasePath, migrationsPath, path.join(directory, "backups"));

    const upgraded = new Database(databasePath);
    expect(
      upgraded.prepare('SELECT title FROM "BacklogGame" WHERE id = ?').get("game-1")
    ).toEqual({ title: "Existing game" });
    upgraded.close();
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
    expect(migrationCount(databasePath)).toBe(6);
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
