const express = require('express');
const passport = require('passport');
const MylarmController = express.Router();
const logger = require('../config/winston');
const connection = require('../config/connection');
const sequelize = require('sequelize');
const ContactLists = require('../models/ContactLists');
const GroupMembers = require('../models/GroupMembers');
const Notifications = require('../models/Notifications');
const NotificationResponders = require('../models/NotificationResponders');
const sms = require('../config/sms');
const call = require('../config/call');

MylarmController.route('/all-group-member').get(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const userId = req.user.dataValues.USER_ID;
        let groupName = "Life Threatening";
        query = 'select MEMBER_NAME, MOBILE_NUMBER, GROUP_ID, GM.CONTACT_ID from group_members GM join contact_lists CL on GM.contact_id=CL.contact_id where GM.group_id=(select group_id from user_groups where group_name =:groupName ) and user_id=:userId;';
        LIFE_THREATENING_GROUP = await connection.query(query, { replacements: { groupName: groupName, userId: userId }, type: sequelize.QueryTypes.SELECT });
        groupName = "Fire";
        FIRE_GROUP = await connection.query(query, { replacements: { groupName: groupName, userId: userId }, type: sequelize.QueryTypes.SELECT });
        groupName = "Medical";
        MEDICAL_GROUP = await connection.query(query, { replacements: { groupName: groupName, userId: userId }, type: sequelize.QueryTypes.SELECT });
        groupName = "Accident";
        ACCIDENT_GROUP = await connection.query(query, { replacements: { groupName: groupName, userId: userId }, type: sequelize.QueryTypes.SELECT });
        res.status(200).json({ status: 'success', data: { LIFE_THREATENING_GROUP, FIRE_GROUP, MEDICAL_GROUP, ACCIDENT_GROUP } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/add-group-member').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const user = req.user.dataValues;
        const body = req.body;
        let contactId;
        let isAlreadyMember;
        contact = await ContactLists.findOne({ where: { MOBILE_NUMBER: body.MOBILE_NUMBER } });
        if (!contact) {
            query = 'insert into CONTACT_LISTS (MOBILE_NUMBER) values("' + body.MOBILE_NUMBER + '");';
            contact = await connection.query(query, { type: sequelize.QueryTypes.INSERT });
            contactId = contact[0];
        } else {
            contactId = contact.CONTACT_ID;
            isAlreadyMember = await GroupMembers.findOne({ where: { USER_ID: user.USER_ID, GROUP_ID: body.GROUP_ID, CONTACT_ID: contactId } });
        }
        if (isAlreadyMember) {
            res.status(200).json({ status: 'fail', error: { errorMessage: body.MEMBER_NAME + ' is already a member.' } });
            return;
        }
        query = 'insert into GROUP_MEMBERS (USER_ID,GROUP_ID,CONTACT_ID,MEMBER_NAME) values(' + user.USER_ID + ',' + body.GROUP_ID + ',' + contactId + ',"' + body.MEMBER_NAME + '");';
        await connection.query(query, { type: sequelize.QueryTypes.INSERT });
        res.status(200).json({ status: 'success', data: { contactId } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/remove-group-member').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const user = req.user.dataValues;
        let body = req.body;
        body['USER_ID'] = user.USER_ID;
        delete body['MOBILE_NUMBER'];
        await GroupMembers.destroy({ where: body });
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/raise-alert').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const user = req.user.dataValues;
        const userId = user.USER_ID;
        let body = req.body;
        body['SENDER_USER_ID'] = userId;
        Notifications.create(body);
        query = 'select MOBILE_NUMBER, GROUP_NAME from group_members GM join contact_lists CL on GM.contact_id=CL.contact_id join user_groups UG on GM.group_id=UG.group_id where GM.group_id=? and GM.user_id=?;';
        memberList = await connection.query(query, { replacements: [body.GROUP_ID, userId], type: sequelize.QueryTypes.SELECT });
        for (let member of memberList) {
            let message = user.FIRST_NAME + ' ' + user.LAST_NAME + ' has raised an alert of ' + member.GROUP_NAME + '. Contact number is ' + user.MOBILE_NUMBER + '. Current location is ' + 'https://www.google.com/maps/search/?api=1&query=' + body.LATITUDE + "," + body.LONGITUDE;
            sms.sendAlert(member.MOBILE_NUMBER, message);
            //call.call(member.MOBILE_NUMBER);
        }
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/close-alert').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const NOTIFICATION_ID = req.body.NOTIFICATION_ID;
        await Notifications.update({ STATUS: 'CLOSE' }, { where: { NOTIFICATION_ID } });
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/my-alerts').get(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const userId = req.user.dataValues.USER_ID;
        query = 'select NOTIFICATION_ID, GROUP_NAME, NOTIFICATION_DATE, LATITUDE, LONGITUDE from NOTIFICATIONS N join USER_GROUPS UG on N.GROUP_ID=UG.GROUP_ID  where SENDER_USER_ID=:userId and status="OPEN"';
        alertList = await connection.query(query, { replacements: { userId: userId }, type: sequelize.QueryTypes.SELECT });
        query1 = 'select FIRST_NAME, LAST_NAME, MOBILE_NUMBER, RESPOND_TIME from notification_responders NR join users U on NR.user_id=U.user_id where NR.notification_id=:notificationId;';
        alertList = JSON.parse(JSON.stringify(alertList));
        for (let alert of alertList) {
            responderList = await connection.query(query1, { replacements: { notificationId: alert.NOTIFICATION_ID }, type: sequelize.QueryTypes.SELECT });
            alert['responderList'] = responderList;
        }
        //console.log(alertList);
        res.status(200).json({ status: 'success', data: { alertList } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/alerts-for-me').get(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const userId = req.user.dataValues.USER_ID;
        query = 'select NOTIFICATION_ID, FIRST_NAME, LAST_NAME, U.MOBILE_NUMBER, NOTIFICATION_DATE, LATITUDE, LONGITUDE, STATUS, GROUP_NAME from users U join notifications N on U.user_id=N.SENDER_USER_ID join USER_GROUPS UG on N.group_id=UG.group_id join GROUP_MEMBERS GM on N.group_id=GM.group_id and GM.user_id=U.user_id join CONTACT_LISTS CL on GM.CONTACT_ID=GM.CONTACT_ID and N.status="OPEN" and CL.MOBILE_NUMBER = (select MOBILE_NUMBER from users where user_id=:userId);';
        alertList = await connection.query(query, { replacements: { userId: userId }, type: sequelize.QueryTypes.SELECT });
        query1 = 'select FIRST_NAME, LAST_NAME, MOBILE_NUMBER, RESPOND_TIME from notification_responders NR join users U on NR.user_id=U.user_id where NR.notification_id=:notificationId;';
        alertList = JSON.parse(JSON.stringify(alertList));
        for (let alert of alertList) {
            responderList = await connection.query(query1, { replacements: { notificationId: alert.NOTIFICATION_ID }, type: sequelize.QueryTypes.SELECT });
            alert['responderList'] = responderList;
        }
        res.status(200).json({ status: 'success', data: { alertList } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/respond-to-alert').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const USER_ID = req.user.dataValues.USER_ID;
        const NOTIFICATION_ID = req.body.NOTIFICATION_ID;
        ifExist = await NotificationResponders.findOne({ where: { NOTIFICATION_ID, USER_ID } });
        if (ifExist) {
            res.status(200).json({ status: 'success', data: {} });
            return;
        }
        await NotificationResponders.create({ NOTIFICATION_ID, USER_ID });
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});

MylarmController.route('/alert-responder-list').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const NOTIFICATION_ID = req.body.NOTIFICATION_ID;
        query = 'select NOTIFICATION_ID, FIRST_NAME, LAST_NAME, MOBILE_NUMBER, RESPOND_TIME from NOTIFICATION_RESPONDERS NR join USERS U on U.USER_ID=NR.USER_ID and NOTIFICATION_ID=:notificationId'
        responderList = await connection.query(query, { replacements: { notificationId: NOTIFICATION_ID }, type: sequelize.QueryTypes.SELECT });
        res.status(200).json({ status: 'success', data: { responderList } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});


module.exports = MylarmController;