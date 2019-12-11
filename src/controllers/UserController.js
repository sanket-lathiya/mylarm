const express = require('express');
const passport = require('passport');
const UserController = express.Router();
const Users = require('../models/Users');
const logger = require('../config/winston');

UserController.route('/list').get(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        userList = await Users.findAll();
        res.status(200).json({ status: 'success', data: { userList } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(200).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    };
});


module.exports = UserController;