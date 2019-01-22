'use strict';

const express = require("express");
const router = express.Router();
const User = require("./models").User;
const Course = require("./models").Course;

// GET /users
// Route for getting current user
router.get('/users', (req, res, next) => {
    User.find({})
            .sort({createdAt: -1})
            .exec((err, users) => {
                if(err) return next(err);
                res.json(users);
            });
});

// POST /users
// Route for creating users
router.post('/users', (req, res, next) => {
    res.status(201).json({message: 'created user'});
});

// GET /courses
// Route for getting a list of courses
router.get('/courses', (req, res, next) => {
    Course.find({})
            .sort({createdAt: -1})
            .exec((err, users) => {
                if(err) return next(err);
                res.json(users);
            });
});

// GET /courses/:id
// Route for getting a specific course
router.get('/courses/:id', (req, res, next) => {
    Course.findById(req.params.id, (err, doc) => {
        if(err) return next(err);
        res.json(doc);
    })
});

// POST /courses
// Route for creating a course
router.post('/courses', (req, res, next) => {
    res.status(201).json({message: 'Create a course'});
});

// PUT /courses/:id
// Route for updating a specific course
router.put('/courses/:id', (req, res, next) => {
    res.status(204).json({message: 'Update course'});
});

// DELETE /courses/:id
//  Route for deleting a specific course
router.delete('/courses/:id', (req, res, next) => {
    res.status(204).json({message: 'delete course'});
});

module.exports = router;