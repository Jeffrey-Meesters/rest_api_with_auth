'user string';
const mongoose = require("mongoose");


const Schema = mongoose.Schema;
const UserSchema = new Schema({
  firstName: String,
  lastName: String,
  emailAddress: String,
  password: String
});

const CourseSchema = new Schema({
  user: [{type: Schema.Types.ObjectId, ref: 'User'}],
  title: String,
  description: String,
  estimatedTime: String,
  materialsNeeded: String
})

const Users = mongoose.model("User", UserSchema);
const Courses = mongoose.model("Course", CourseSchema);

export default {
    Users,
    Courses
}