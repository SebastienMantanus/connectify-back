require("dotenv").config();
const express = require("express");
const axios = require("axios");
const isAuthentificated = require("../middlewares/isAuthentificated.js");
const router = express.Router();
const cors = require("cors");
router.use(cors());

// import Note model
const Note = require("../models/Note.js");

// *** NOTES ROUTES ***

// Notes creation route

router.post("/note/create", isAuthentificated, async (req, res) => {
  try {
    const newNote = new Note({
      content: req.body.content,
      affiliate: req.body.affiliate,
      responsable: req.user,
    });
    await newNote.save();
    // get all notes from affiliate
    const newNotesArray = await Note.find({
      affiliate: req.body.affiliate,
    }).sort({ created_at: -1 });

    res.json(newNotesArray);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Notes update route

router.patch("/note/:id", isAuthentificated, async (req, res) => {
  try {
    const noteToUpdate = await Note.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        responsable: req.user,
      },
      { new: true }
    );
    await noteToUpdate.save();
    res.status(200).json({
      message: "Note updated !",
      note: noteToUpdate,
    });
  } catch (error) {
    console.log(error.message);
    res.status(400).json("Note update >> Something is Wrong");
  }
});

// Notes delete route

router.delete("/note/delete/:id", isAuthentificated, async (req, res) => {
  try {
    // grab the affiliate id
    const response = await Note.findById(req.params.id);
    const affiliateId = response.affiliate.toString();
    // delete the note
    await Note.findByIdAndDelete(req.params.id);
    // get all notes from affiliate
    const newNotesArray = await Note.find({
      affiliate: affiliateId,
    }).sort({ created_at: -1 });
    console.log(newNotesArray);
    res.json(newNotesArray);
  } catch (error) {
    res.status(400).json("Note delete >> Something is Wrong");
  }
});

// Notes get route

router.get("/note/:id", isAuthentificated, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    res.json(note);
  } catch (error) {
    res.status(400).json("Note get >> Something is Wrong");
  }
});

// Notes get all route

router.get("/notes", isAuthentificated, async (req, res) => {
  try {
    const notes = await Note.find()
      .populate("affiliate responsable")
      .sort({ created_at: -1 });
    res.json(notes);
  } catch (error) {
    res.status(400).json("Notes get all >> Something is Wrong");
  }
});

// Get all notes from one affiliate

router.get("/notes/:id", isAuthentificated, async (req, res) => {
  try {
    const notes = await Note.find({ affiliate: req.params.id })
      .populate("responsable")
      .sort({ created_at: -1 });
    res.json(notes);
  } catch (error) {
    res.status(400).json("Notes get all >> Something is Wrong");
  }
});

// Get all notes from one user

router.get("/notes/user/:id", isAuthentificated, async (req, res) => {
  try {
    const notes = await Note.find({ responsable: req.params.id }).populate(
      "affiliate"
    );
    res.json(notes);
  } catch (error) {
    res.status(400).json("Notes get all >> Something is Wrong");
  }
});

module.exports = router;
