const accountSid = 'ACcb5c8c9deae613e6662cf2071a4ee684';
const authToken = 'ecb7a2ad941abc1c9a45ef5d6df1b3b6';

var client = require('twilio')(accountSid, authToken);

function call(to, message) {
    //console.log(message);
    client.calls
        .create({
            url: 'http://demo.twilio.com/docs/voice.xml',
            to: to,
            from: '+17243052611'
        }).then(call => logger.info("Calling... " + to + ". , " + + call.sid))
        .catch(error => logger.error("Error while calling... " + to + ". , " + error));
}

module.exports = {
    call
};