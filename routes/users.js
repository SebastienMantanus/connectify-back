const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");

const router = express.Router();

const User = require("../models/User");

// *** USER ROUTES ***

// Users list
router.get("/users", async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.post("/users/create", async (req, res) => {
  if (req.body.name && req.body.email && req.body.password) {
    try {
      const password = req.body.password;
      const salt = uid2(16);
      const hash = SHA256(password + salt).toString(encBase64);
      const token = uid2(16);

      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        salt: salt,
        hash: hash,
        token: token,
      });
      console.log(newUser);
      await newUser.save();
      res.status(200).json(newUser);
    } catch (error) {
      console.error("catch message", error.message);
    }
  } else {
    res.status(201).json({
      message: "missing items",
    });
  }
});

router.post("/users/login", async (req, res) => {
  if (req.body.email && req.body.password) {
    console.log(req.body.email);

    const user = await User.findOne({ email: req.body.email });

    console.log(user.name);
    const hash = SHA256(req.body.password + user.salt).toString(encBase64);
    if (hash === user.hash) {
      res.status(200).json(user);
    } else {
      res.status(400).json({ statut: "wrong password" });
    }
  } else {
    res.status(400).json({ statut: "missing email or password" });
  }
});

router.get("/users/send/", async (req, res) => {
  console.log("coucou");
});
module.exports = router;
