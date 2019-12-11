const Sequelize = require('sequelize');

const connection = new Sequelize('MYLARM', 'root', 'sanketlathiya', {
  host: 'localhost',
  port: '3306',
  dialect: 'mysql',
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

module.exports = connection;