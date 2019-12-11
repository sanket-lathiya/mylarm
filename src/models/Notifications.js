const sequelize = require('sequelize');
const connection = require('../config/connection');

const Notifications = connection.define('notifications', {
    NOTIFICATION_ID: { type: sequelize.BIGINT, primaryKey: true },
    SENDER_USER_ID: sequelize.BIGINT,
    GROUP_ID: sequelize.BIGINT,
    NOTIFICATION_DATE: sequelize.DATE,
    LATITUDE: sequelize.STRING,
    LONGITUDE: sequelize.STRING,
    STATUS: sequelize.STRING
}, { timestamps: false });

module.exports = Notifications;