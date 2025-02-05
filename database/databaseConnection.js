// databaseConnection.js
const { Sequelize } = require('sequelize');
const { createClient } = require('@libsql/client');
require('dotenv').config();

const tursoClient = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

class TursoSequelize extends Sequelize {
  constructor() {
    super('sqlite::memory:', {
      dialect: 'sqlite',
      logging: false
    });
    
    this.tursoClient = tursoClient;
  }

  define(modelName, attributes, options = {}) {
    const model = super.define(modelName, attributes, options);
    
    model.create = async function(values) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const fieldsToInsert = {
          ...values,
          createdAt: timestamp,
          updatedAt: timestamp
        };

        // Build the SQL query
        const fields = Object.keys(fieldsToInsert);
        const placeholders = fields.map(() => '?').join(', ');
        const vals = fields.map(field => fieldsToInsert[field]);
        
        const query = `
          INSERT INTO ${model.tableName} 
          (${fields.join(', ')}) 
          VALUES (${placeholders})
        `;

        // Execute the query
        const result = await tursoClient.execute({
          sql: query,
          args: vals
        });

        // Return the created record
        return {
          ...fieldsToInsert,
          id: result.lastInsertRowid
        };
      } catch (error) {
        console.error('Create error:', error);
        throw error;
      }
    };

    model.findOne = async function(options = {}) {
      try {
        const where = options.where || {};
        const conditions = Object.entries(where)
          .map(([key]) => `${key} = ?`)
          .join(' AND ');
        
        const query = `SELECT * FROM ${model.tableName} WHERE ${conditions} LIMIT 1`;
        const result = await tursoClient.execute({
          sql: query,
          args: Object.values(where)
        });
        
        return result.rows[0] || null;
      } catch (error) {
        console.error('FindOne error:', error);
        throw error;
      }
    };

    model.update = async function(values, options = {}) {
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const updateValues = {
          ...values,
          updatedAt: timestamp
        };

        const where = options.where || {};
        const sets = Object.entries(updateValues)
          .map(([key]) => `${key} = ?`)
          .join(', ');
        
        const whereConditions = Object.entries(where)
          .map(([key]) => `${key} = ?`)
          .join(' AND ');

        const query = `
          UPDATE ${model.tableName}
          SET ${sets}
          WHERE ${whereConditions}
        `;

        const args = [
          ...Object.values(updateValues),
          ...Object.values(where)
        ];

        await tursoClient.execute({ sql: query, args });
        return [1];
      } catch (error) {
        console.error('Update error:', error);
        throw error;
      }
    };

    return model;
  }

  async authenticate() {
    try {
      await this.tursoClient.execute('SELECT 1');
      return true;
    } catch (error) {
      throw error;
    }
  }
}

const sequelize = new TursoSequelize();
module.exports = sequelize;