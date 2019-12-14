const accountSid = 'ACcb5c8c9deae613e6662cf2071a4ee684';
const authToken = 'ecb7a2ad941abc1c9a45ef5d6df1b3b6';
const client = require('twilio')(accountSid, authToken);
const logger = require('./winston');

function sendOTP(to, OTP) {
    client.messages.create({
        body: 'Your OTP is ' + OTP + '.',
        from: '+17243052611',
        to: to
    }).then(message => logger.info("OTP " + OTP + " is sent to " + to + " , " + message.sid))
        .catch(error => logger.error("Error while sending OTP " + OTP + " to " + to + ". , " + error));
}

function sendAlert(to, body) {
    client.messages.create({
        body: body,
        from: '+17243052611',
        to: to
    }).then(message => logger.info("Alert sent to " + to + ".  , " + message.sid))
        .catch(error => logger.error("Error while sending alert to " + to + ". , " + error));
}

module.exports = {
    sendOTP,
    sendAlert
};