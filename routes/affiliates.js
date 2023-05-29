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

// ********* MAIN ROUTES FOR AFFILIATES V1 *********

// Affiliate detail by ID
router.get("/affiliates/:id", isAuthentificated, async (req, res) => {
  try {
    const affiliateSearch = await Affiliate.findById(req.params.id)
      .populate("responsable")
      .populate("updatadBy")
      .populate("contact_folder");
    console.log(affiliateSearch);
    res.status(200).json(affiliateSearch);
  } catch (error) {
    res.status(400).json("affiliate error");
  }
});

// Affiliate list with filters
router.get("/affiliates-search/", isAuthentificated, async (req, res) => {
  let skip = "";
  if (req.query.skip) {
    skip = req.query.skip;
  }
  let limit = "";
  if (req.query.limit) {
    limit = req.query.limit;
  }

  let filters = {};
  if (req.query.name) {
    filters.name = new RegExp(req.query.name, "i");
  }
  if (req.query.email) {
    filters.email = new RegExp(req.query.email, "i");
  }
  if (req.query.contact) {
    filters.contact = new RegExp(req.query.contact, "i");
  }

  const results = await Affiliate.find(filters)
    .populate("responsable")
    .populate("updatadBy")
    .skip(skip)
    .limit(limit);

  res.status(200).json([req.user, results]);
});

// Create Affiliate route
router.post("/affiliates/create", isAuthentificated, async (req, res) => {
  //destructuring du req.body
  const { name, email, website, description, contact, telephone } = req.body;

  //ajout à la base de donnée avec sécurités
  if (name && email && website && description && contact && telephone) {
    try {
      const user = await User.findOne({ name: req.user.name });
      if (user) {
        const newAffiliate = new Affiliate({
          name: name,
          email: email,
          website: website,
          description: description,
          contact: contact,
          telephone: telephone,
          responsable: user,
        });
        await newAffiliate.save();
        res.status(200).json(newAffiliate);
        console.log("partenaire ajouté");
      } else {
        res.status(200).json("nom du responsable de compte non trouvé");
      }
    } catch (error) {
      console.log(error.message);
      res.status(400).json("Affilate creation >> Something is Wrong");
    }
  } else {
    res.status(201).json("Ajout à la base impossible, élément manquant");
  }
});

// Update Affiliate route
router.post("/affiliate/update/:id", isAuthentificated, async (req, res) => {
  const { name, email, website, description, contact, telephone } = req.body;
  try {
    if (name && email && website && description && contact && telephone) {
      const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
        req.params.id,
        {
          name: name,
          email: email,
          website: website,
          description: description,
          contact: contact,
          telephone: telephone,
          updatadBy: req.user,
        },
        { new: true }
      );
      if (affiliateToUpdate) {
        res.status(200).json({
          message: "Affiliate updated !",
          affiliate: affiliateToUpdate,
        });
      } else {
        res.status(404).json({ message: "Affiliate not found" });
      }
    }
  } catch (error) {
    console.log(error.message);
    res.status(400).json("Affilate update >> Something is Wrong");
  }
});

// Delete Affiliate route
router.delete("/affiliate/delete/:id", isAuthentificated, async (req, res) => {
  try {
    await Affiliate.findByIdAndDelete(req.params.id);
    res.json({ message: "Affiliate removed" });
  } catch (error) {
    res.status(400).json("Affilate delete >> Something is Wrong");
  }
});

// Adding avatars to Affiliates route : note used for now
router.post(
  "/addimage/:id",
  isAuthentificated,
  fileUpload(),
  async (req, res) => {
    if (req.files.picture) {
      try {
        // search existing avatar from Affiliate
        const affiliateToCheck = await Affiliate.findById(req.params.id);

        if (affiliateToCheck.avatar) {
          // on remonte l'ID public de l'avatar pour le supprimer
          const avatartoDelete = affiliateToCheck.avatar.public_id;
          // On supprime l'avatar de Cloudinary
          const deleteResponse = await cloudinary.uploader.destroy(
            avatartoDelete
          );
        }
        // on remonte le nouvel avatar
        const converted = convertToBase64(req.files.picture);
        const result = await cloudinary.uploader.upload(converted, {
          folder: "Annuaire",
        });
        const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
          req.params.id,
          {
            avatar: result,
            updatadBy: req.user,
          },
          { new: true }
        );
        if (affiliateToUpdate) {
          return res.status(200).json({
            message: "Affiliate updated !",
            affiliate: affiliateToUpdate,
          });
        } else {
          res.status(400).json({ message: "Affiliate not found" });
        }
      } catch (error) {
        res.status(400).json("Image Upload >> Something is Wrong");
      }
    }
  }
);

// Add Favicon to Cloudinary

router.get("/addfavicon/:id", async (req, res) => {
  try {
    // On cible le contact
    const affiliateSearch = await Affiliate.findById(req.params.id);
    const favicon_url = `https://icon.horse/icon/${affiliateSearch.website}`;

    // on envoie tout ça dans Cloudinary
    const result = await cloudinary.uploader.upload(favicon_url, {
      folder: "Connectify",
    });

    // on met à jour le contact
    const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
      req.params.id,
      {
        favicon: result,
      },
      { new: true }
    );
    return res.json("Favicon OK");
  } catch (error) {
    res.status(400).json("favicon Upload >> Something is Wrong");
  }
});

// ****** NEW ROUTES *******

// Autocomplete company

router.get("/autocreate/autocomplete", async (req, res) => {
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

// Create new contact V2

router.post(
  "/autocreate/contactcreate",
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
