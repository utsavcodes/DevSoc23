const mongoose = require("mongoose");
const { stringify } = require("querystring");
const Schema = mongoose.Schema;

const userSchema = new Schema({
  Name: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    required: true,
    unique: true,
  },
  Password: {
    type: String,
  },
  Age:{
    type: String,
  },
  Amputation: {
    type: String,
  },
  Dob: {
    type: String,
  },
  Gender: {
    type: String,
  }
});


module.exports = mongoose.model("User", userSchema);