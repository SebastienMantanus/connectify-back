// Status MongoDB Model

const mongoose = require("mongoose");

const shema = mongoose.Schema(
  {
    status_name: {
      type: String,
      required: true,
    },
    status_description: {
      type: String,
    },
    status_color: {
      type: String,
      default: "#000000",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

const Status = mongoose.model("Status", shema);
module.exports = Status;
