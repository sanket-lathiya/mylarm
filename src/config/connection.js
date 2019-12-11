const Sequelize = require('sequelize');

// const connection = new Sequelize('MYLARM', 'root', 'sanketlathiya', {
//   host: 'localhost',
//   port: '3306',
//   dialect: 'mysql',
//   pool: {
//     max: 10,
//     min: 0,
//     acquire: 30000,
//     idle: 10000
//   }
// });

const connection = new Sequelize('heroku_cb6110f5b720501', 'bddee429e291a0', '859497f0', {
  host: 'us-cdbr-iron-east-05.cleardb.net',
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