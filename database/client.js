const { drizzle } = require("drizzle-orm/mysql2");
require("dotenv").config();
const mysql = require("mysql2/promise"); 

async function setupConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',  
      password: 'Ahmed18131806',  
      database: 'drizzle'
    });
    const db = drizzle(connection); 
    return db;
  } catch (error) {
    console.error('Failed to connect to the database:', error);
    throw error;
  }
}


module.exports = {setupConnection};