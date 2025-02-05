require('dotenv').config();
const { drizzle } = require('drizzle-orm/libsql');
const { createClient } = require('@libsql/client');

// Validate environment variables
if (!process.env.TURSO_DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in environment variables');
}

if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error('DATABASE_AUTH_TOKEN is not defined in environment variables');
}

// Create the client with validated environment variables
const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

const db = drizzle(client);

module.exports = { db };