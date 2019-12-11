const sequelize = require('sequelize');
const connection = require('../config/connection');

const NotificationResponders = connection.define('notification_responders', {
    NOTIFICATION_ID: sequelize.BIGINT,
    USER_ID: sequelize.BIGINT,
    RESPOND_TIME: sequelize.DATE
}, { timestamps: false });

NotificationResponders.removeAttribute('id');

module.exports = NotificationResponders;