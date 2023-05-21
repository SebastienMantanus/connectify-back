const mongoose = require("mongoose");
const User = require("./User");

const Affiliate = mongoose.model("Affiliate", {
  company_name: String,
  company_legalform: String,
  company_address: String,
  company_zip: String,
  company_city: String,
  company_size_min: Number,
  company_size_max: Number,
  company_capital: Number,
  company_activity: String,
  company_founded: String,
  company_registration_number: Number,
  company_website: String,
  company_favicon: Object,

  contact_name: String,
  contact_role: String,
  contact_email: String,
  contact_phone: String,

  // app fields
  responsable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  updatadBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // Old fields (not used in V2)
  starred: Boolean,
  avatar: Object,
  favicon: Object,
});

module.exports = Affiliate;
