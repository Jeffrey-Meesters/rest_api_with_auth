'use strict';

const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { check, validationResult } = require('express-validator/check');
const auth = require('basic-auth');
const User = require("./models").User;
const Course = require("./models").Course;

const authenticateUser = (req, res, next) => {
    let message = null;
    const credentials = auth(req);

    if (credentials) {
        // .emailAddress === credentials.name
        const user = User.find({}, (err, u) => {
            u.forEach((user) => {
                if (user.emailAddress === credentials.name) {
                    return u
                }
            })
        });
        console.log(user)
        if (user) {
            const authenticated = bcrypt.compareSync(credentials.pass, user.password);

            if (authenticated) {
                console.log(`Authentication successful for username: ${user.emailAddress}`);
                req.currentUser = user;
            } else {
                message = 'User authentication faild'
            }
        } else {
            message = 'User is not found'
        }
    } else {
        message = 'Auth header not found'
    }

    if (message) {
        console.warn(message);

        res.status(401).json({message: 'Access Denied'})
    } else {
        next();
    }
}

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
router.get('/users', authenticateUser, (req, res, next) => {
    const { currentUser } = req;

    if (currentUser) {
    User.find({})
            .sort({createdAt: -1})
            .exec((err, users) => {
                if(err) return next(err);
                res.status(200);
                res.json(users);
            });
    }
});

// POST /users
// Route for creating users
router.post('/users', [
    check('firstName').exists().withMessage('Please provide a firstName'),
    check('lastName').exists().withMessage('Please provide a lastName'),
    check('emailAddress').exists().withMessage('Please provide a emailAddress'),
    check('password').exists().withMessage('Please provide a password'),
], (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400);
        res.json(errorMessages);
    } else {
        const data = req.body;
        bcrypt.hash(data.password, saltRounds, function(error, hash) {
            if (!error) {
                data.password = hash;
                const user = new User(data);
                user.save((err, user) => {
                    if(err) return next(err);
                    res.status(201);
                    res.json(user);
                })
            } else {
                res.status(500)
                res.json(error);
            }
        })
    }
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
    res.status(200);
    res.json(req.course);
});

// POST /courses
// Route for creating a course
router.post('/courses', [
    check('user').exists().withMessage('Tho who is this course connected?'),
    check('title').exists().withMessage('Please provide a title'),
    check('description').exists().withMessage('Please provide a description')
], (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400);
        res.json(errorMessages);
    } else {
        const course = new Course(req.body);
        course.save((err, course) => {
            if(err) return next(err);
            res.status(201);
            res.json(course);
        })
    }
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