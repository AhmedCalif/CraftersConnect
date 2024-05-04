const { drizzle } = require("drizzle-orm/mysql2");
const mysql = require("mysql2/promise"); 

async function setupConnection() {
  const connection = await mysql.createConnection({
    host: "host",
    user: 'root',
    database: 'drizzle',
    password: 'Ahmed18131806,'
  });
  const db = drizzle(connection);
  return db;
}

module.exports = {setupConnection};