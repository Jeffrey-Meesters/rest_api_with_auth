'use strict';

const express = require("express");
const router = express.Router();
const User = require("./models").User;
const Course = require("./models").Course;

// setup a friendly greeting for the root route
router.get('/', (req, res) => {
    console.log('User', User)
    console.log('Course', Course);
    res.json({
        message: 'Welcome to the REST API project!',
    });
});

module.exports = router;