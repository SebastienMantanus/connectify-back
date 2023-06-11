require("dotenv").config();
const express = require("express");
const axios = require("axios");
const isAuthentificated = require("../middlewares/isAuthentificated.js");
const router = express.Router();
const cors = require("cors");
router.use(cors());

// Cloudinary
const fileUpload = require("express-fileupload");
const cloudinary = require("cloudinary").v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const convertToBase64 = (file) => {
  return `data:${file.mimetype};base64,${file.data.toString("base64")}`;
};

//import des modèles
const Affiliate = require("../models/Affiliate");
const User = require("../models/User");

// ********* MAIN ROUTES FOR AFFILIATES *********

// Affiliate detail by ID
router.get("/affiliate/:id", isAuthentificated, async (req, res) => {
  try {
    const affiliateSearch = await Affiliate.findById(req.params.id).populate(
      "responsable updatadBy contact_status contact_folder"
    );
    console.log(affiliateSearch);
    res.status(200).json(affiliateSearch);
  } catch (error) {
    res.status(400).json("affiliate error");
  }
});

// Affiliates list filtered by filters

router.get("/affiliates", isAuthentificated, async (req, res) => {
  try {
    // skip and limit
    let skip = "";
    if (req.query.skip) {
      skip = req.query.skip;
    }
    let limit = "";
    if (req.query.limit) {
      limit = req.query.limit;
    }

    // add filters by company_name, contact_email, contact_name, contact_heat, contact_status, contact_folder
    let filters = {};

    // add an $or opertator with contact_name, company_name, contact_email filters

    if (req.query.q) {
      filters.$or = [];
    }
    if (req.query.q) {
      filters.$or.push({
        contact_name: new RegExp(req.query.q, "i"),
      });
      filters.$or.push({
        company_name: new RegExp(req.query.q, "i"),
      });
      filters.$or.push({
        contact_email: new RegExp(req.query.q, "i"),
      });
    }

    // put others filters in the filters object

    if (req.query.current_user === "true") {
      filters.responsable = req.user._id;
    }

    // create a .$and operator with the other filters

    if (req.query.responsable) {
      filters.responsable = req.query.responsable;
    }
    if (req.query.contact_folder) {
      filters.contact_folder = req.query.contact_folder;
    }
    if (req.query.contact_status) {
      filters.contact_status = req.query.contact_status;
    }
    if (req.query.contact_heat) {
      filters.contact_heat = req.query.contact_heat;
    }

    // find affiliates with filters
    const affiliates = await Affiliate.find(filters)
      .populate("responsable updatadBy contact_folder contact_status")
      .skip(skip)
      .limit(limit);

    res.status(200).json(affiliates);
  } catch (error) {
    res.status(400).json("affiliates error");
  }
});

// change responsable (user) of affiliate
router.patch(
  "/affiliates/:id/change-responsable",
  isAuthentificated,
  async (req, res) => {
    try {
      const affiliate = await Affiliate.findById(req.params.id);
      if (affiliate) {
        affiliate.responsable = req.body.responsable;
        await affiliate.save();
        res.status(200).json(affiliate);
      } else {
        res.status(400).json("Affiliate not found");
      }
    } catch (error) {
      res.status(400).json("Affiliate not found");
    }
  }
);

// Delete Affiliate route
router.delete("/affiliate/delete/:id", isAuthentificated, async (req, res) => {
  try {
    await Affiliate.findByIdAndDelete(req.params.id);
    res.json({ message: "Affiliate deleted" });
  } catch (error) {
    res.status(400).json("Affilate delete >> Something is Wrong");
  }
});

// Affiliate update route  V2
router.patch("/affiliate/:id", isAuthentificated, async (req, res) => {
  console.log(req.body);
  try {
    const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,

        updatadBy: req.user,
      },
      { new: true }
    );
    await affiliateToUpdate.save();
    res.status(200).json({
      message: "Affiliate updated !",
      affiliate: affiliateToUpdate,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json("Affilate update >> Something is Wrong");
  }
});

// Affiliate creation step 1 : Autocomplete company

router.get("/affiliate/create/autocomplete", async (req, res) => {
  if (req.query.q) {
    try {
      const response = await axios.get(
        `https://suggestions.pappers.fr/v2?q=${req.query.q}&longueur=20&cibles=denomination`
      );

      const autocomplete_arr = [];

      if (response.data.resultats_denomination.length > 0) {
        for (let i = 0; i < response.data.resultats_denomination.length; i++) {
          if (response.data.resultats_denomination[i].date_cessation === null) {
            autocomplete_arr.push({
              company_name:
                response.data.resultats_denomination[i].denomination,
              company_legalform:
                response.data.resultats_denomination[i].forme_juridique,
              company_address:
                response.data.resultats_denomination[i].siege.adresse_ligne_1,
              company_zip:
                response.data.resultats_denomination[i].siege.code_postal,
              company_city: response.data.resultats_denomination[i].siege.ville,
              company_size_min:
                response.data.resultats_denomination[i].effectif_min,
              company_size_max:
                response.data.resultats_denomination[i].effectif_max,
              company_capital: response.data.resultats_denomination[i].capital,
              company_activity:
                response.data.resultats_denomination[i].domaine_activite,
              company_founded:
                response.data.resultats_denomination[i].date_creation_formate,
              company_registration_number:
                response.data.resultats_denomination[i].siren,
            });
          }
        }
      }
      res.status(200).json(autocomplete_arr);
    } catch (error) {
      res.status(400).json({ request_fail: error.data });
    }
  } else {
    res.status(400).json({ error: error.message });
  }
});

// Affiliate creation step 2 : form validation and creation

router.post(
  "/affiliate/create/savetodb",
  isAuthentificated,
  async (req, res) => {
    console.log("welcome to the creation route");

    // step 1 : destructuring body
    const {
      contact_name,
      contact_role,
      contact_email,
      contact_phone,
      company_name,
      company_legalform,
      company_address,
      company_zip,
      company_city,
      company_size_min,
      company_size_max,
      company_capital,
      company_activity,
      company_founded,
      company_registration_number,
      company_website,
    } = req.body;

    // step 2 : search favicon and upload to cloudinary

    let company_favicon = {};
    try {
      const favicon_url = `https://icon.horse/icon/${company_website}`;
      const result = await cloudinary.uploader.upload(favicon_url, {
        folder: "Connectify_V2",
      });

      company_favicon = { id: result.public_id, url: result.secure_url };
    } catch (error) {
      console.log("Cloudinary error : ", error.message);
    }

    // step 3 : create contact in database

    try {
      const newAffiliate = new Affiliate({
        contact_name,
        contact_role,
        contact_email,
        contact_phone,
        company_name,
        company_legalform,
        company_address,
        company_zip,
        company_city,
        company_size_min,
        company_size_max,
        company_capital,
        company_activity,
        company_founded,
        company_registration_number,
        company_website,
        company_favicon,
        responsable: req.user,
      });

      await newAffiliate.save();
      res.status(200).json(newAffiliate);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
