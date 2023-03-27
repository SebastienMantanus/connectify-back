const express = require("express");
require("dotenv").config();
const isAuthentificated = require("../middlewares/isauthentificated");
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

//routes affiliates (test route, not for use in the app)
// router.get("/affiliates", isAuthentificated, async (req, res) => {
//   try {
//     const showAffiliates = await Affiliate.find().populate("responsable");
//     console.log(req.user);
//     res.status(200).json([req.user, showAffiliates]);
//   } catch (error) {
//     res.status(400).json("Affiliates listing error : ", error.message);
//   }
// });

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

// Adding avatars to Affiliates route : note used
// router.post(
//   "/addimage/:id",
//   isAuthentificated,
//   fileUpload(),
//   async (req, res) => {
//     if (req.files.picture) {
//       try {
//         // search existing avatar from Affiliate
//         const affiliateToCheck = await Affiliate.findById(req.params.id);

//         if (affiliateToCheck.avatar) {
//           // on remonte l'ID public de l'avatar pour le supprimer
//           const avatartoDelete = affiliateToCheck.avatar.public_id;
//           // On supprime l'avatar de Cloudinary
//           const deleteResponse = await cloudinary.uploader.destroy(
//             avatartoDelete
//           );
//         }
//         // on remonte le nouvel avatar
//         const converted = convertToBase64(req.files.picture);
//         const result = await cloudinary.uploader.upload(converted, {
//           folder: "Annuaire",
//         });
//         const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
//           req.params.id,
//           {
//             avatar: result,
//             updatadBy: req.user,
//           },
//           { new: true }
//         );
//         if (affiliateToUpdate) {
//           return res.status(200).json({
//             message: "Affiliate updated !",
//             affiliate: affiliateToUpdate,
//           });
//         } else {
//           res.status(400).json({ message: "Affiliate not found" });
//         }
//       } catch (error) {
//         res.status(400).json("Image Upload >> Something is Wrong");
//       }
//     }
//   }
// );

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
module.exports = router;
