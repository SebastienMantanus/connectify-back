// authorisations routes
require("dotenv").config();
const express = require("express");
const isAuthentificated = require("../middlewares/isAuthentificated.js");
const router = express.Router();
const cors = require("cors");
router.use(cors());

// import models
const Authorisation = require("../models/Authorisation.js");
const User = require("../models/User.js");

// CRUD

// Create an authorisation
router.post("/authorisation/create", isAuthentificated, async (req, res) => {
  try {
    const newAuthorisation = new Authorisation({
      authorisation_name: req.body.authorisation_name,
    });
    await newAuthorisation.save();
    res.json(newAuthorisation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read all authorisations
router.get("/authorisations", isAuthentificated, async (req, res) => {
  try {
    const authorisations = await Authorisation.find();
    res.json(authorisations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Read one authorisation
router.get("/authorisation/:id", isAuthentificated, async (req, res) => {
  try {
    const authorisation = await Authorisation.findById(req.params.id);
    res.json(authorisation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an authorisation
router.patch("/authorisation/:id", isAuthentificated, async (req, res) => {
  try {
    const authorisation = await Authorisation.findById(req.params.id);
    if (req.body.authorisation_name) {
      authorisation.authorisation_name = req.body.authorisation_name;
    }
    await authorisation.save();
    res.json(authorisation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add an user to an authorisation
router.patch(
  "/authorisation/add-user/:id",
  isAuthentificated,
  async (req, res) => {
    try {
      const authorisation = await Authorisation.findById(req.params.id);

      // check if user is already in the authorisation

      if (authorisation.granted_users.includes(req.body.user_id)) {
        res.json({ message: "User already in authorisation" });
      } else {
        authorisation.granted_users.push(req.body.user_id);
        await authorisation.save();
        res.json(authorisation);
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Remove an user from an authorisation
router.patch(
  "/authorisation/remove-user/:id",
  isAuthentificated,
  async (req, res) => {
    try {
      const authorisation = await Authorisation.findById(req.params.id);

      // check if user is already in the authorisation
      if (authorisation.granted_users.includes(req.body.user_id)) {
        // remove user from the array
        authorisation.granted_users = authorisation.granted_users.filter(
          (user) => {
            return user != req.body.user_id;
          }
        );
        await authorisation.save();
        res.json(authorisation);
      } else {
        res.json({ message: "User not in authorisation" });
      }
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  }
);

// Get all authorisations for an user
router.get("/authorisations/user/:id", isAuthentificated, async (req, res) => {
  try {
    // get all authorisations
    const authorisations = await Authorisation.find();

    // get user

    const user = await User.findById(req.params.id);

    // create an array with all authorisations for the user
    const userAuthorisations = [];

    // check if user is in the authorisation
    for (let i = 0; i < authorisations.length; i++) {
      if (authorisations[i].granted_users.includes(user._id)) {
        userAuthorisations.push(authorisations[i]);
      }
    }
    // send the array with user populated
    res.json(userAuthorisations);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Check if an specific User have an authorisation
router.post("/authorisation/user/:id", isAuthentificated, async (req, res) => {
  console.log(req.body.user_id);
  try {
    // get authorisation
    const authorisation = await Authorisation.findById(req.params.id);

    // check if user is in the authorisation
    if (authorisation.granted_users.includes(req.body.user_id)) {
      res.json({ message: "User is in authorisation", granted: true });
    } else {
      res.json({ message: "User is not in authorisation", granted: false });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// maintenance route to put the users without authorisation in the authorisation 64cb508418c4da2bb4f818d3 (user)
router.get("/putauthorisation", isAuthentificated, async (req, res) => {
  try {
    const authorisation = await Authorisation.findById(
      "64cb508418c4da2bb4f818d3"
    );
    const users = await User.find();
    for (let i = 0; i < users.length; i++) {
      if (!authorisation.granted_users.includes(users[i]._id)) {
        authorisation.granted_users.push(users[i]._id);
      }
    }
    await authorisation.save();
    res.json(authorisation);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
