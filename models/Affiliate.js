const mongoose = require("mongoose");
const User = require("./User");
const Folder = require("./Folder");
const Status = require("./Status");

const shema = mongoose.Schema(
  {
    company_name: { type: String, required: true },
    company_legalform: { type: String, default: "Non renseigné" },
    company_address: { type: String, default: "Non renseigné" },
    company_zip: { type: Number, default: 0 },
    company_city: { type: String, default: "Non renseigné" },
    company_size_min: { type: Number, default: 0 },
    company_size_max: { type: Number, default: 0 },
    company_capital: { type: Number, default: 0 },
    company_activity: { type: String, default: "Non renseigné" },
    company_founded: { type: String, default: "Non renseigné" },
    company_registration_number: { type: Number, default: 0 },
    company_website: { type: String, required: true },
    company_favicon: Object,

    contact_name: { type: String, required: true },
    contact_role: { type: String, default: "Non renseigné" },
    contact_email: { type: String, required: true },
    contact_phone: { type: String, default: "Non renseigné" },

    contact_heat: { type: Number, default: 0 },
    contact_status: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Status",
      default: "6479bc43389c9806da874bb3",
    },
    contact_folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: "647377874977d0f948b08d71",
    },

    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatadBy: {
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

const Affiliate = mongoose.model("Affiliate", shema);
module.exports = Affiliate;
