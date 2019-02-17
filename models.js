'use strict';
const mongoose = require("mongoose");


const Schema = mongoose.Schema;

// Define userSchema
const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  emailAddress: String,
  password: String
});

// I've looked this up: https://stackoverflow.com/questions/41243575/mongoose-return-error-in-pre-middleware
// This is a pre save hook on the UserSchema
UserSchema.pre("save", function(next) {
  const self = this;
  // Use mongooses' models to get a connection to the Users table
  // Search of the given email address already exists in the DB
  mongoose.models.User.findOne({emailAddress: self.emailAddress}, (err, user) => {
    // if error throw 500 error
    if(err) {
      return next(500);
    }

    // If a user was found throw an error
    // because the email address does exist
    if (user) {
      const error = new Error('email address must be unique');
      next(error);
    } else {
      // else continue
      next();
    }
  })
})

// Define courses schema
const CourseSchema = new Schema({
  // It references a user ID
  // which should be the creator/owner of the course
  user: [{type: Schema.Types.ObjectId, ref: 'User'}],
  title: String,
  description: String,
  estimatedTime: String,
  materialsNeeded: String
})

// instantiate the models
const User = mongoose.model("User", UserSchema);
const Course = mongoose.model("Course", CourseSchema);

// exports the models so they can be used elsewhere
module.exports = {
    User,
    Course
}