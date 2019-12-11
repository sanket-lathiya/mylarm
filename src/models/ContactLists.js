const sequelize = require('sequelize');
const connection = require('../config/connection');

const ContactLists = connection.define('contact_lists', {
    CONTACT_ID: { type: sequelize.BIGINT, primaryKey: true },
    MOBILE_NUMBER: sequelize.STRING
}, { timestamps: false });

module.exports = ContactLists;