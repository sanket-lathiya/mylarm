const sequelize = require('sequelize');
const connection = require('../config/connection');

const GroupMembers = connection.define('group_members', {
    USER_ID: { type: sequelize.BIGINT, primaryKey: true },
    GROUP_ID: { type: sequelize.BIGINT, primaryKey: true },
    CONTACT_ID: { type: sequelize.BIGINT, primaryKey: true },
    MEMBER_NAME: sequelize.STRING
}, { timestamps: false });

module.exports = GroupMembers;