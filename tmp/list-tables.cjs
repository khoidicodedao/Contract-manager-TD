const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
  console.log('--- All Tables ---');
  tables.forEach(t => console.log(t.name));
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
