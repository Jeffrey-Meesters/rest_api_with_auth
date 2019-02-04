'use strict';

// load modules
const express = require('express');
const morgan = require('morgan');
const mongoose = require("mongoose");
var jsonParser = require("body-parser").json;

// connect mongoose to our DB which is running localy
mongoose.connect("mongodb://localhost:27017/fsjstd-restapi", { useNewUrlParser: true });
// Store the connection
const db = mongoose.connection;

// Check for connection errors
db.on("error", (error) => {
    console.log("error happened:", error)
});

// db open connection
db.once("open", () => {
    console.log("DB connection seccussful!")
    // DB code goes here
});

// variable to enable global error logging
const enableGlobalErrorLogging = process.env.ENABLE_GLOBAL_ERROR_LOGGING === 'true';

// create the Express app
const app = express();
app.use(jsonParser());
const routes = require("./routes");

// setup morgan which gives us http request logging
app.use(morgan('dev'));

// TODO setup your api routes here
// setup a friendly greeting for the root route
app.get('/', (req, res) => {
  res.json({
      message: 'Welcome to the REST API project!',
  });
});

app.use('/api', routes);

// send 404 if no other route matched
app.use((req, res) => {
  res.status(404).json({
    message: 'Route Not Found',
  });
});

// setup a global error handler
app.use((err, req, res, next) => {
  if (enableGlobalErrorLogging) {
    console.error(`Global error handler: ${JSON.stringify(err.stack)}`);
  }

  res.status(err.status || 500).json({
    message: err.message,
    error: {},
  });
});

// set our port
app.set('port', process.env.PORT || 5000);

// start listening on our port
const server = app.listen(app.get('port'), () => {
  if (server.address().port === 5000) {
    console.log(`Express server is listening on port http://localhost:${server.address().port}`);
  } else {
    console.log(`Express server is listening on port ${server.address().port}`);
  }
});
