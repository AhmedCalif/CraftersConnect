
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('freedb_craftersconnect', 'freedb_ahmedcalif', 'frsmrw*uX4aNpm?', {
    host: 'sql.freedb.tech',
    dialect: 'mysql',
    logging: console.log
});

module.exports = sequelize;
