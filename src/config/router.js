const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const UserController = require('../controllers/UserController');
const MylarmController = require('../controllers/MylarmController');


router.use('/auth', AuthController);

router.use('/users', UserController);

router.use('/mylarm', MylarmController);

module.exports = router;
