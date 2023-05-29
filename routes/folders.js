require("dotenv").config();
const express = require("express");
const axios = require("axios");
const isAuthentificated = require("../middlewares/isAuthentificated.js");
const router = express.Router();
const cors = require("cors");
router.use(cors());

// import models
// const User = require("../models/User.js");
const Folder = require("../models/Folder.js");
const Affiliate = require("../models/Affiliate.js");

// *** FOLDER ROUTES ***

// Folders creation route

router.post("/folder/create", isAuthentificated, async (req, res) => {
  try {
    const newFolder = new Folder({
      name: req.body.name,
      description: req.body.description,
      responsable: req.user,
    });
    await newFolder.save();
    res.json(newFolder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// if the affiliate folder key dosen't exist, add it and set it to the default folder

router.get("/folder/add-folder-key", isAuthentificated, async (req, res) => {
  try {
    // get all affiliates
    const affiliates = await Affiliate.find();
    // check for each affiliate if the folder key exist
    affiliates.map(async (affiliate) => {
      if (!affiliate.contact_folder) {
        console.log("no folder key");
        // if not, update the affiliate with the default folder key
        const affiliateToUpdate = await Affiliate.findByIdAndUpdate(
          affiliate._id,
          {
            contact_folder: ObjectId(`647377874977d0f948b08d71`),
          },
          { new: true }
        );
        await affiliateToUpdate.save();
      }
    });
    res.json(affiliates);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Folders list route

router.get("/folders", isAuthentificated, async (req, res) => {
  try {
    const folders = await Folder.find({ responsable: req.user });
    res.json(folders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Folders update route

router.patch("/folder/:id", isAuthentificated, async (req, res) => {
  try {
    const folderToUpdate = await Folder.findById(req.params.id);
    console.log(folderToUpdate);
    if (folderToUpdate) {
      folderToUpdate.name = req.body.name;
      folderToUpdate.description = req.body.description;
      await folderToUpdate.save();
      res.json(folderToUpdate);
    } else {
      res.status(400).json({ message: "Folder not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Folders delete route

router.delete("/folder/:id", isAuthentificated, async (req, res) => {
  // check if folder contains affiliates

  const affiliates = await Affiliate.find({
    contact_folder: req.params.id,
  });

  // if yes, change eatch affiliate folder to default folder

  if (affiliates.length > 0) {
    affiliates.map(async (affiliate) => {
      affiliate.contact_folder = "647377874977d0f948b08d71";
      await affiliate.save();
    });
  }

  // check if the folder is not the default folder before deleting

  if (req.params.id === "647377874977d0f948b08d71") {
    res.status(400).json({ message: "You can't delete this folder" });
  } else {
    try {
      const folderToDelete = await Folder.findById(req.params.id);
      if (folderToDelete) {
        await Folder.findByIdAndDelete(req.params.id);
        res.json({ message: "Folder deleted" });
      } else {
        res.status(400).json({ message: "Folder not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
});

// Folders details route

router.get("/folder/:id", isAuthentificated, async (req, res) => {
  try {
    const result = {};
    // find the folder
    let folder = await Folder.findById(req.params.id);
    if (folder) {
      // find all affiliates in the folder
      const affiliates = await Affiliate.find({
        contact_folder: req.params.id,
      });
      // add the affiliates to the folder object
      result.folder = folder;
      result.affiliates = affiliates;

      res.status(200).json(result);
    } else {
      res.status(400).json({ message: "Folder not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// add affiliate to folder route

router.patch("/folder/:id/add", isAuthentificated, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);

    if (folder) {
      // check if affiliate is already in the folder
      const affiliate = await Affiliate.findById(req.body.affiliate_id);
      if (affiliate.contact_folder === req.params.id) {
        res.status(400).json({ message: "Affiliate already in this folder" });
      } else {
        affiliate.contact_folder = req.params.id;
        await affiliate.save();
        res.json(affiliate);
      }
    } else {
      res.status(400).json({ message: "Folder not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// change affiliate folder route

router.patch(
  "/folder/:id/change-folder",
  isAuthentificated,
  async (req, res) => {
    try {
      const folder = await Folder.findById(req.params.id);
      console.log(folder);
      if (folder) {
        // check if affiliate is already in the folder
        const AffiliateToChange = await Affiliate.findById(
          req.body.affiliate_id
        );
        console.log(AffiliateToChange.contact_folder._id);
        if (AffiliateToChange.contact_folder == req.params.id) {
          console.log("already in this folder");
          res.status(400).json({ message: "Affiliate already in this folder" });
        } else {
          AffiliateToChange.contact_folder = req.params.id;
          await AffiliateToChange.save();
          res.json(AffiliateToChange);
        }
      } else {
        res.status(400).json({ message: "Folder not found" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// export routes
module.exports = router;
