const mongoose = require("mongoose");
const User = require("./User");

const Affiliate = mongoose.model("Affiliate", {
  name: String,
  email: String,
  website: String,
  description: String,
  contact: String,
  telephone: String,
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  updatadBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  starred: Boolean,
  avatar: Object,
  favicon: Object,
});

module.exports = Affiliate;
