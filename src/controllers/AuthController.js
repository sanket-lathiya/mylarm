const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const AuthController = express.Router();
const Users = require('../models/Users');
const config = require('../config/config');
const logger = require('../config/winston');
const GenerateOTP = require('../utility/GenerateOTP');
const sms = require('../config/sms');
const Crypto = require('../utility/Crypto');

AuthController.route('/signup').post(async function (req, res) {
    try {
        var user = req.body;
        //console.log(user);
        const isUserExist = await Users.findOne({ where: { MOBILE_NUMBER: user.MOBILE_NUMBER } });
        if (isUserExist) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'User already exist with mobile number ' + user.MOBILE_NUMBER } });
            return;
        }
        const OTP = GenerateOTP.generateOTP();
        sms.sendOTP(user.MOBILE_NUMBER, OTP);
        const token = jwt.sign({ user, OTP }, config.jwt_secret, {
            //algorithm: config.algorithm,
            expiresIn: 3600 // 1 h
        });
        res.status(200).json({ status: 'success', data: { accessToken: `Bearer ${token}` } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/verify-signup-otp').post(async function (req, res) {
    try {
        const OTP = req.body.OTP;
        const bearerToken = req.headers.authorization;
        const token = bearerToken.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt_secret);
        if (decoded.OTP !== OTP) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'Invalid OTP.' } });
            return;
        }
        try {
            let user = decoded.user;
            let pwd = user.PWD;
            pwd = Crypto.encrypt(pwd);
            user.PWD = pwd;
            await Users.create(user);
            res.status(200).json({ status: 'success', data: {} });
        } catch (error) {
            logger.error("Error sending verification email to " + decoded.user.EMAIL_ID + error);
            res.status(500).json({ status: 'fail', error: { errorMessage: "Error sending verification email to " + decoded.user.EMAIL_ID } });
            return;
        }
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/send-otp').post(async function (req, res) {
    try {
        const mobileNumber = req.body.MOBILE_NUMBER;
        const isUserExist = await Users.findOne({ where: { MOBILE_NUMBER: mobileNumber } });
        if (!isUserExist) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'User does not exist with mobile number ' + mobileNumber } });
            return;
        }
        const OTP = GenerateOTP.generateOTP();
        sms.sendOTP(mobileNumber, OTP);
        const token = jwt.sign({ MOBILE_NUMBER: mobileNumber, OTP }, config.jwt_secret, {
            //algorithm: config.algorithm,
            expiresIn: 3600 // 1 h
        });
        res.status(200).json({ status: 'success', data: { accessToken: `Bearer ${token}` } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/verify-otp').post(async function (req, res) {
    try {
        const OTP = req.body.OTP;
        const bearerToken = req.headers.authorization;
        const token = bearerToken.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt_secret);
        if (decoded.OTP !== OTP) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'Invalid OTP.' } });
            return;
        }
        const user = await Users.findOne({ where: { MOBILE_NUMBER: decoded.MOBILE_NUMBER } });
        const newToken = jwt.sign({ user }, config.jwt_secret, {
            //algorithm: config.algorithm,
            expiresIn: 3600 * 12 // 12 h
        });
        res.status(200).json({ status: 'success', data: { user, accessToken: `Bearer ${newToken}` } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/pwd-login').post(async function (req, res) {
    try {
        const mobileNumber = req.body.MOBILE_NUMBER;
        const pwd = req.body.PWD;
        const user = await Users.findOne({ where: { MOBILE_NUMBER: mobileNumber } });
        if (!user) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'User does not exist with mobile number ' + mobileNumber } });
            return;
        }
        userPwd = Crypto.decrypt(user.PWD);
        if (pwd !== userPwd) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'Incorrect password !' } });
            return;
        }
        const token = jwt.sign({ user }, config.jwt_secret, {
            //algorithm: config.algorithm,
            expiresIn: 3600 * 12 // 12 h
        });
        res.status(200).json({ status: 'success', data: { user, accessToken: `Bearer ${token}` } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/update-pwd').post(async function (req, res) {
    try {
        const bearerToken = req.headers.authorization;
        const token = bearerToken.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt_secret);
        let newPwd = req.body.NEW_PWD;
        newPwd = Crypto.encrypt(newPwd);
        await Users.update({ PWD: newPwd }, { where: { USER_ID: decoded.user.USER_ID } });
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/change-pwd').post(passport.authenticate('jwt', { session: false }), async function (req, res) {
    try {
        const userId = req.body.USER_ID;
        const oldPwd = req.body.OLD_PWD;
        let newPwd = req.body.NEW_PWD;
        let userPwd = await Users.findOne({ where: { USER_ID: userId } });
        userPwd = Crypto.decrypt(userPwd.PWD);
        if (oldPwd !== userPwd) {
            res.status(200).json({ status: 'fail', error: { errorMessage: 'Incorrect old password !' } });
            return;
        }
        newPwd = Crypto.encrypt(newPwd);
        await Users.update({ PWD: newPwd }, { where: { USER_ID: userId } });
        res.status(200).json({ status: 'success', data: {} });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});

AuthController.route('/refresh-token').get(async function (req, res) {
    try {
        const bearerToken = req.headers.authorization;
        let token = bearerToken.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt_secret);
        const user = decoded.user;
        token = jwt.sign({ user }, config.jwt_secret, {
            //algorithm: config.algorithm,
            expiresIn: 3600 // 1 h
        });
        res.status(200).json({ status: 'success', data: { accessToken: `Bearer ${token}` } });
    } catch (error) {
        logger.error("ERROR ... " + error);
        res.status(500).json({ status: 'fail', error: { errorMessage: 'Something went wrong.' } });
    }
});


module.exports = AuthController;