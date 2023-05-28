require("dotenv").config();
const express = require("express");
const axios = require("axios");
const isAuthentificated = require("../middlewares/isAuthentificated.js");
const router = express.Router();
const cors = require("cors");
router.use(cors());

// import models
const User = require("../models/User.js");
const Folder = require("../models/Folder.js");

// *** FOLDER ROUTES ***

// Folders creation

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

// Folders list

router.get("/folders", isAuthentificated, async (req, res) => {
  try {
    const folders = await Folder.find({ responsable: req.user });
    res.json(folders);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Folders update

router.post("/folder/update/:id", isAuthentificated, async (req, res) => {
  try {
    const folderToUpdate = await Folder.findById(req.params.id);
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

// Folders delete

router.post("/folder/delete/:id", isAuthentificated, async (req, res) => {
  try {
    const folderToDelete = await Folder.findById(req.params.id);
    if (folderToDelete) {
      await folderToDelete.remove();
      res.json({ message: "Folder deleted" });
    } else {
      res.status(400).json({ message: "Folder not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Folders details

router.get("/folder/:id", isAuthentificated, async (req, res) => {
  try {
    const folder = await Folder.findById(req.params.id);
    if (folder) {
      res.json(folder);
    } else {
      res.status(400).json({ message: "Folder not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// export routes
module.exports = router;
