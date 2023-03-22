const mongoose = require("mongoose");

const User = mongoose.model("User", {
  name: String,
  email: String,
  hash: String,
  salt: String,
  token: String,
  favourites: String,
});

module.exports = User;
