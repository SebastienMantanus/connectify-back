// User aurotisation model

const mongoose = require("mongoose");
const User = require("./User");

const shema = mongoose.Schema(
  {
    authorisation_name: {
      type: String,
      required: true,
    },
    granted_users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Authorisation = mongoose.model("Authorisation", shema);
module.exports = Authorisation;
