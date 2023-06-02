const express = require("express");
const router = express.Router();
const cors = require("cors");
router.use(cors());

//import des modèles
const Status = require("../models/Status");
const isAuthentificated = require("../middlewares/isAuthentificated");

// ********* MAIN ROUTES FOR STATUS *********

// Status list
router.get("/status", isAuthentificated, async (req, res) => {
  try {
    const statusList = await Status.find();
    res.status(200).json(statusList);
  } catch (error) {
    res.status(400).json("status error");
  }
});

// Status detail by ID
router.get("/status/:id", isAuthentificated, async (req, res) => {
  try {
    const statusSearch = await Status.findById(req.params.id);
    res.status(200).json(statusSearch);
  } catch (error) {
    res.status(400).json("status error");
  }
});

// Status creation
router.post("/status/create", isAuthentificated, async (req, res) => {
  try {
    const status = await Status.create(req.body);
    res.status(200).json(status);
  } catch (error) {
    res.status(400).json("status error");
  }
});

// Status update
router.patch("/status/:id", isAuthentificated, async (req, res) => {
  // prevent update default status
  if (req.params.id === "6479bc43389c9806da874bb3") {
    res.status(400).json("Default status can't be updated");
    return;
  }

  try {
    const status = await Status.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.status(200).json(status);
  } catch (error) {
    res.status(400).json("status error");
  }
});

// Status delete
router.delete("/status/:id", isAuthentificated, async (req, res) => {
  // prevent delete default status
  if (req.params.id === "6479bc43389c9806da874bb3") {
    res.status(400).json("Default status can't be deleted");
    return;
  }
  try {
    const status = await Status.findByIdAndDelete(req.params.id);
    res.status(200).json(status);
  } catch (error) {
    res.status(400).json("status error");
  }
});

module.exports = router;
