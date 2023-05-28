const mongoose = require("mongoose");

const User = require("./User");

const shema = mongoose.Schema(
  {
    name: String,
    description: String,
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamp: true }
);

const Folder = mongoose.model("Folder", shema);

module.exports = Folder;
