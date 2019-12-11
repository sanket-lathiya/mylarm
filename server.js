const express = require('express'),
  path = require('path'),
  passport = require('passport'),
  bodyParser = require('body-parser'),
  cors = require('cors'),
  connection = require('./src/config/connection'),
  router = require('./src/config/router'),
  logger = require('./src/config/winston');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Passport Middleware
app.use(passport.initialize());
require('./src/config/passport')(passport);

app.use(express.static(path.join(__dirname, 'dist')));

app.use(router);

app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

const port = process.env.PORT || 4000;

app.listen(port, function () {
  logger.info('Listening on port ' + port);
});

connection.authenticate().then(() => {
  logger.info('Connection has been established successfully.');
}).catch(error => {
  logger.error('Unable to connect to the database: ' + error);
});


