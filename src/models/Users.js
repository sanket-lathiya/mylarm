const sequelize = require('sequelize');
const connection = require('../config/connection');

const Users = connection.define('users', {
    USER_ID: { type: sequelize.BIGINT, primaryKey: true },
    FIRST_NAME: sequelize.STRING,
    LAST_NAME: sequelize.STRING,
    MOBILE_NUMBER: sequelize.STRING,
    PWD: sequelize.STRING
}, { timestamps: false });

module.exports = Users;