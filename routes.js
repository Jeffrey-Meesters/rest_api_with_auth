'use strict';

const express = require("express");
const router = express.Router();
const bcrypt = require('bcrypt');
const saltRounds = 10;
const { check, validationResult } = require('express-validator/check');
const auth = require('basic-auth');
const User = require("./models").User;
const Course = require("./models").Course;

// User authentication function
const authenticateUser = (req, res, next) => {
    // get the credentials form the request object
    const credentials = auth(req);

    if (credentials) {
        
        // find the user by email address (should be unique)
        User.findOne({'emailAddress': credentials.name}, (error, user) => {
            if (error) {
                console.warn('error in DB search', error);
                res.status(401).json({message: 'Access Denied'})
            }

            if (user) {
                // We found a user with this email address.
                // So use bcrypt to compare the hashed password with the given password
                const authenticated = bcrypt.compareSync(credentials.pass, user.password);

                if (!authenticated) {
                    res.status(401).json({message: 'Access Denied'})
                } else {
                    // User is authenticated
                    // So store the currentUsr on the request object
                    req.currentUser = user;
                    next();
                }
            } else {
                console.warn('users not found');
                res.status(401).json({message: 'Access Denied'})
            }
        })
    } else {
        console.warn('Auth header not found');
        res.status(401).json({message: 'Access Denied'})
    }
}

// This is a router param
// Created to easely retrieve courses by ID
router.param("id", (req, res, next, id) => {
    Course.findById(id, (err, doc) => {
        if(err) {
            return next(err);
        }
        
        if(!doc) {
            err = new Error("Not found");
            err.status = 404;
            return next(err);
        }

        // set the found course on the request object
        req.course = doc;
        return next();
    })
})

// GET /users
// Route for getting current user
// authenticateUser: user should be authenticated before this middleware executes
router.get('/users', authenticateUser, (req, res, next) => {
    // because when the user is authenticated req.currentUser will exist
    // the status is 200 and return the current user
    if (req.currentUser) {

        res.status(200).json(req.currentUser);

    } else {

        // When this happens authentication succeeded, but something went wrong when setting
        // the currentUser on the req object
        console.warn('Auth was succesfull, but User is not found on the request object');
        res.status(404).json({message: 'User not found'});

    }
});

// POST /users
// Route for creating users
// Validate if all required input exists
router.post('/users', [
    check('firstName').exists().withMessage('Please provide a firstName'),
    check('lastName').exists().withMessage('Please provide a lastName'),
    check('emailAddress').exists().withMessage('Please provide a emailAddress'),
    check('password').exists().withMessage('Please provide a password'),
], (req, res, next) => {
    const errors = validationResult(req);

    // If there are errors send the error messages to the user
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400).json(errorMessages);
    
    } else if (!req.body.firstName || !req.body.lastName || !req.body.emailAddress || !req.body.password) {
        const error = new Error('Please provide: firstname, lastname, email address and password');
        error.status = 400;
        next(error);
    } else {
        // The user data is on the body of the request object
        const data = req.body;
        // use bcryt to hash the user password
        bcrypt.hash(data.password, saltRounds, function(error, hash) {
            // if no errors overwrite the password with the hash
            // and store the user data in the DB
            if (!error) {
                data.password = hash;
                const user = new User(data);
                user.save((err, user) => {
                    if(err) {
                        return next(err);
                    }

                    res.status(201).json(user);
                })
            } else {
                res.status(500).json(error);
            }
        })
    }
});

// GET /courses
// Route for getting a list of courses
router.get('/courses', (req, res, next) => {
    // find and respons with all ccourses
    Course.find({})
            .sort({createdAt: -1})
            .exec((err, courses) => {
                if(err) {
                    return next(err);
                }

                res.status(200).json(courses);
            });
});

// GET /courses/:id
// Route for getting a specific course
router.get('/courses/:id', (req, res, next) => {
    // find and respond with a specific course
    // this course is set on the request body bt the param middleware
    if (req.course) {
        res.status(200).json(req.course);
    } else {
        const error = new Error('Course not found');
        error.status = 404;
        next(error);
    }
});

// POST /courses
// Route for creating a course
// Validate if all required input exists
// Authenticate user
router.post('/courses', [
    check('user').exists().withMessage('To who is this course connected?'),
    check('title').exists().withMessage('Please provide a title'),
    check('description').exists().withMessage('Please provide a description')
], 
authenticateUser, 
(req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(error => error.msg);
        res.status(400);
        res.json(errorMessages);
    } else if (!req.body.user || !req.body.title || !req.body.description ) {
        const error = new Error('Please provide: user, title and description');
        error.status = 400;
        next(error);        
    } else {
        const course = new Course(req.body);
        if (course) {
            course.save((err, course) => {
                if(err) {
                    return next(err);
                }
                
                console.log(course._id);
                res.location(`/api/courses/${course._id}`);
                res.sendStatus(201);
            })
        } else {
            const error = new Error('Course information not found');
            next(error);
        }
    }
});

// PUT /courses/:id
// Route for updating a specific course
router.put('/courses/:id', [
    check('user').exists().withMessage('Tho who is this course connected?'),
    check('title').exists().withMessage('Please provide a title'),
    check('description').exists().withMessage('Please provide a description')
], 
authenticateUser, 
(req, res, next) => {

    if (!req.course.user || !req.course.title || !req.course.description) {
        const error = new Error('Please provide: user, title and description');
        error.status = 400;
        return next(error); 
    }
    
    // Object destructuring to get the currentUser from the req object
    // Got a linter warning on this at work and find it awesome :p    
    const { currentUser } = req;
    const ownerIds = req.body.user;

    // A user may only update a course if he/she is the owner
    // So loop over owner ids
    // check if the currentUser is the owner
    // If so update else forbid the user

    // The id is inside an array
    // instead of using [0] I decided to use a foreach loop
    // when more users are associated with a course
    ownerIds.forEach(id => {
        User.findById(id, (error, user) => {
            if (error) {
                return next(error)
            }

            console.log(currentUser, user);
            if (user) {
                // emailAddresses should be unique
                // So when the currentUser emailaddress does not match with the courses owner
                // email adddress te currentUser may not update it
                if (currentUser.emailAddress !== user.emailAddress) {
                        
                    res.sendStatus(403) 
            
                } else {
                
                    req.course.update(req.body, (err, data) => {
                        if(err) {
                            return next(err);
                        }
                
                        res.sendStatus(201)
                    });
            
                }
            } else {
                res.status(403).json({message: 'User not found'})
            }
        })
    });
});

// DELETE /courses/:id
//  Route for deleting a specific course
router.delete('/courses/:id', authenticateUser, (req, res, next) => {

    const { currentUser } = req;
    const ownerIds = req.course.user;

    // A user may only delete a course if he/she is the owner
    // So loop over owner ids
    // check if the currentUser is the owner
    // If so delete else forbid the user
    ownerIds.forEach(id => {
        // find a user by id
        User.findById(id, (error, user) => {
            if (error) {
                return next(error)
            }

            if (user) {
                // emailAddresses should be unique
                // So when the currentUser emailaddress does not match with the courses owner
                // email adddress te currentUser may not delete it
                if (currentUser.emailAddress !== user.emailAddress) {
                        
                    res.sendStatus(403) 
            
                } else {
                    
                    // remove the course from the DB
                    req.course.remove((err) => {
                        if(err) {
                            return next(err);
                        }
                
                        res.sendStatus(204);
                    })
            
                }
            } else {
                res.status(403).json({message: 'User not found'})
            }
        })
    });
});

module.exports = router;