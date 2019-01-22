'use strict';

const express = require("express");
const router = express.Router();
const User = require("./models").User;
const Course = require("./models").Course;

router.param("id", (req, res, next, id) => {
    Course.findById(id, (err, doc) => {
        if(err) return next(err);
        if(!doc) {
            err = new Error("Not found");
            err.status = 404;
            return next(err);
        }
        req.course = doc;
        return next();
    })
})

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
    const user = new User(req.body);
    user.save((err, user) => {
        if(err) return next(err);
        res.status(201);
        res.json(user);
    })
});

// GET /courses
// Route for getting a list of courses
router.get('/courses', (req, res, next) => {
    Course.find({})
            .sort({createdAt: -1})
            .exec((err, users) => {
                if(err) return next(err);
                res.status(200);
                res.json(users);
            });
});

// GET /courses/:id
// Route for getting a specific course
router.get('/courses/:id', (req, res, next) => {
    res.json(req.course);
});

// POST /courses
// Route for creating a course
router.post('/courses', (req, res, next) => {
    const course = new Course(req.body);
    course.save((err, course) => {
        if(err) return next(err);
        res.status(201);
        res.json(course);
    })
});

// PUT /courses/:id
// Route for updating a specific course
router.put('/courses/:id', (req, res, next) => {
    req.course.update(req.body, (err, data) => {
        if(err) next(err);
        res.status(201);
        res.json(data);
    });
});

// DELETE /courses/:id
//  Route for deleting a specific course
router.delete('/courses/:id', (req, res, next) => {
    req.course.remove((err) => {
        if(err) return next(err);
        res.sendStatus(204);
    })
});

module.exports = router;