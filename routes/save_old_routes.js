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
const Affiliate = require("../models/Affiliate.js");
const User = require("../models/User.js");

// ********* MAIN ROUTES FOR AFFILIATES *********

// Affiliate detail by ID
router.get("/affiliates/:id", isAuthentificated, async (req, res) => {
  try {
    const affiliateSearch = await Affiliate.findById(req.params.id)
      .populate("responsable")
      .populate("updatadBy");
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

//Affiliate create by SIREN number

router.get("/autocreate", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.pappers.fr/v2/recherche-dirigeants?api_token=${process.env.PAPPERS_API_KEY}&q=${req.query.q}&code_postal=${req.query.zip}&entreprise_cessee=false`
    );

    console.log(response.data);

    if (response.data.total > 0) {
      //Build the return object

      if (response.data.resultats[0].nb_entreprises_total > 0) {
        let managerData = {
          name: response.data.resultats[0].nom_complet,
          age: response.data.resultats[0].age,
          address: `${
            response.data.resultats[0].adresse_ligne_1
              ? response.data.resultats[0].adresse_ligne_1
              : response.data.resultats[0].adresse_ligne_2
          } ${response.data.resultats[0].code_postal} ${
            response.data.resultats[0].ville
          } `,
          nb_companies: response.data.resultats[0].nb_entreprises_total,
          companies: [],
        };

        //add companies to the return object
        for (
          let i = 0;
          i < response.data.resultats[0].entreprises.length;
          i++
        ) {
          if (!response.data.resultats[0].entreprises[i].date_cessation) {
            managerData.companies.push({
              company_name:
                response.data.resultats[0].entreprises[i].nom_entreprise,
              siren: response.data.resultats[0].entreprises[i].siren,
              company_address: `${response.data.resultats[0].entreprises[i].siege.adresse_ligne_1} ${response.data.resultats[0].entreprises[i].siege.code_postal} ${response.data.resultats[0].entreprises[i].siege.ville}`,
              legal_status:
                response.data.resultats[0].entreprises[i].forme_juridique,
              capital: response.data.resultats[0].entreprises[i].capital,
              employees: response.data.resultats[0].entreprises[i].effectif,
              activity:
                response.data.resultats[0].entreprises[i].libelle_code_naf,
              registration_date:
                response.data.resultats[0].entreprises[i].date_creation_formate,
            });
          }
        }

        res.status(200).json(managerData);
      }
    } else {
      console.log("Aucune entreprise associée à ce contact");
      res.status(201).json({ result: "no company found" });
    }
  } catch (error) {
    res.status(400).json("Affiliate auto-creation error");
  }
});

//Nex contact search by owner name

router.get("/autocreate/byname", async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.pappers.fr/v2/recherche-dirigeants?api_token=${process.env.PAPPERS_API_KEY}&q=${req.query.q}&code_postal=${req.query.zip}&entreprise_cessee=false`
    );

    if (response.data.total > 0) {
      //Build the return object

      let managerData = [];

      //build convinient companies array

      for (let i = 0; i < response.data.resultats.length; i++) {
        // let companies_array = [];
        for (
          let j = 0;
          j < response.data.resultats[i].entreprises.length;
          j++
        ) {
          if (
            response.data.resultats[i].entreprises[j].entreprise_cessee === 0
          ) {
            managerData.push({
              manager_name: response.data.resultats[i].nom_complet,
              manager_role: response.data.resultats[i].qualite,
              company_name:
                response.data.resultats[i].entreprises[j].denomination,
              legal_status:
                response.data.resultats[i].entreprises[j].forme_juridique,
              company_registration:
                response.data.resultats[i].entreprises[j].date_creation_formate,
              company_activity:
                response.data.resultats[i].entreprises[j].libelle_code_naf,
              company_address: `${response.data.resultats[i].entreprises[j].siege.adresse_ligne_1} ${response.data.resultats[i].entreprises[j].siege.code_postal} ${response.data.resultats[i].entreprises[j].siege.ville}`,
              company_size: response.data.resultats[i].entreprises[j].effectif,
              company_capital: `${response.data.resultats[i].entreprises[j].capital} €`,
              company_siren: response.data.resultats[i].entreprises[j].siren,
            });
          }
        }
      }

      //result array return
      res.status(200).json(managerData);
    } else {
      res.status(201).json([]);
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

// Affiliate list with filters =>> V1
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
    .populate("contact_folder")
    .skip(skip)
    .limit(limit);

  res.status(200).json([req.user, results]);
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

// ****** NEW ROUTES *******
module.exports = router;

//MODELS

const mongoose = require("mongoose");
const User = require("./User");

const Affiliate = mongoose.model("Affiliate", {
  name: String,
  email: String,
  website: String,
  sirene: Number,
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
