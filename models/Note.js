const mongoose = require("mongoose");

const shema = mongoose.Schema(
  {
    content: { type: String, required: true },
    affiliate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Affiliate",
    },
    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: {
      createdAt: "created_at", // Use `created_at` to store the created date
      updatedAt: "updated_at", // and `updated_at` to store the last updated date
    },
  }
);

const Note = mongoose.model("Note", shema);

module.exports = Note;
