const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  console.log('Dropping index users_username_unique...');
  db.prepare("DROP INDEX IF EXISTS users_username_unique").run();
  console.log('Index dropped successfully.');
} catch (err) {
  console.error('Error dropping index:', err.message);
} finally {
  db.close();
}
