const {defineConfig} = require("drizzle-kit")


module.exports = defineConfig({
  schema: './database/schema/schemaModel.js',
  out: './migrations',
  dialect: 'turso',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }
});