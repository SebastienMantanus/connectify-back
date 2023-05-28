const mongoose = require("mongoose");
const User = require("./User");

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
    contact_phone: { type: Number, default: 0 },

    responsable: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    updatadBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamp: true }
);

const Affiliate = mongoose.model("Affiliate", shema);
module.exports = Affiliate;
