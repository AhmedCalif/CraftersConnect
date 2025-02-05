require('dotenv').config();
const { createClient } = require('@libsql/client');

const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
});

async function dropAllTables() {
    try {
        console.log('Starting database cleanup...');

        // Disable foreign key checks
        await client.execute(`PRAGMA foreign_keys = OFF;`);
        console.log('Foreign key checks disabled');

        // Get all tables
        const tablesResult = await client.execute(`
            SELECT name FROM sqlite_master 
            WHERE type='table' 
            AND name NOT LIKE 'sqlite_%';
        `);

        // First drop all foreign keys for each table
        for (const { name: tableName } of tablesResult.rows) {
            try {
                console.log(`Getting foreign keys for table: ${tableName}`);
                
                const tableInfoResult = await client.execute(`
                    PRAGMA foreign_key_list(${tableName});
                `);

                for (const fk of tableInfoResult.rows) {
                    try {
                        console.log(`Dropping foreign key on table ${tableName} referencing ${fk.table}`);
                        
                        // Create a new table without the foreign key
                        await client.execute(`
                            BEGIN TRANSACTION;
                            
                            -- Get the table creation SQL
                            PRAGMA table_info(${tableName});
                            
                            -- Drop the original table
                            DROP TABLE IF EXISTS ${tableName};
                            
                            COMMIT;
                        `);
                    } catch (fkError) {
                        console.log(`Note: Error dropping foreign key on ${tableName}:`, fkError.message);
                    }
                }
            } catch (tableError) {
                console.log(`Note: Error processing table ${tableName}:`, tableError.message);
            }
        }

        // Now drop all tables
        for (const { name: tableName } of tablesResult.rows) {
            try {
                console.log(`Dropping table: ${tableName}`);
                await client.execute(`DROP TABLE IF EXISTS "${tableName}";`);
                console.log(`Successfully dropped table: ${tableName}`);
            } catch (dropError) {
                console.log(`Note: Error dropping table ${tableName}:`, dropError.message);
            }
        }

        // Re-enable foreign key checks
        await client.execute(`PRAGMA foreign_keys = ON;`);

        console.log('Database cleanup completed successfully');
    } catch (error) {
        console.error('Error during database cleanup:', error);
    } finally {
        process.exit(0);
    }
}

dropAllTables();