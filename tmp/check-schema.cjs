const Database = require('better-sqlite3');
const db = new Database('database.sqlite');

try {
  const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'").get();
  console.log('--- Table Schema ---');
  console.log(schema ? schema.sql : 'Table "users" not found');

  const indexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND tbl_name='users'").all();
  console.log('\n--- Indexes ---');
  indexes.forEach(idx => {
    console.log(`Index: ${idx.name}\nSQL: ${idx.sql}\n`);
  });
} catch (err) {
  console.error(err);
} finally {
  db.close();
}
