require("dotenv").config();
const cors = require("cors");
const express = require("express");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const uid2 = require("uid2");
const router = express.Router();
router.use(cors());

const User = require("../models/User");
const Affiliate = require("../models/Affiliate");
const Authorisation = require("../models/Authorisation");

const isAuthentificated = require("../middlewares/isAuthentificated");

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
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      const hash = SHA256(req.body.password + user.salt).toString(encBase64);
      if (hash === user.hash) {
        res.status(200).json(user);
      } else {
        res.status(201).json("wrong password");
      }
    } else {
      res.status(201).json("wrong email");
    }
  } else {
    res.status(201).json("No account found");
  }
});

// ************ USERS ROUTE FOR BACKOFFICE ************

// Read all users with authorisations and affiliates

router.get("/users/all", isAuthentificated, async (req, res) => {
  // create an array of users
  const users = await User.find();
  let usersArray = [];

  // loop through users
  for (let i = 0; i < users.length; i++) {
    // get authorisations
    const authorisations = await Authorisation.find();
    //loop through authorisations
    const userAuthorisations = [];
    for (let j = 0; j < authorisations.length; j++) {
      if (authorisations[j].granted_users.includes(users[i]._id)) {
        userAuthorisations.push(authorisations[j]);
      }
    }

    // get affiliates
    const affiliates = await Affiliate.find().populate("responsable");
    //loop through affiliates
    const userAffiliates = [];
    for (let k = 0; k < affiliates.length; k++) {
      affiliates[k].responsable.name === users[i].name &&
        userAffiliates.push(affiliates[k]);
    }

    usersArray.push({
      id: users[i]._id,
      name: users[i].name,
      email: users[i].email,
      authorisations: userAuthorisations,
      nbAffiliates: userAffiliates.length,
      affiliates: userAffiliates,
    });
  }

  res.json(usersArray);
});

// Read a specific user with authorisations and affiliates

router.get("/user/complete/:id", isAuthentificated, async (req, res) => {
  // get user
  const user = await User.findById(req.params.id);

  // get authorisations
  const authorisations = await Authorisation.find();
  //loop through authorisations
  const userAuthorisations = [];
  for (let j = 0; j < authorisations.length; j++) {
    if (authorisations[j].granted_users.includes(user._id)) {
      userAuthorisations.push(authorisations[j]);
    }
  }

  // get affiliates
  const affiliates = await Affiliate.find().populate("responsable");
  //loop through affiliates
  const userAffiliates = [];
  for (let k = 0; k < affiliates.length; k++) {
    affiliates[k].responsable.name === user.name &&
      userAffiliates.push(affiliates[k]);
  }

  const userComplete = {
    id: user._id,
    name: user.name,
    email: user.email,
    authorisations: userAuthorisations,
    nbAffiliates: userAffiliates.length,
    affiliates: userAffiliates,
  };

  res.json(userComplete);
});

// chage user password
router.patch("/user/change-password", isAuthentificated, async (req, res) => {
  const password = req.body.password;
  const salt = uid2(16);
  const hash = SHA256(password + salt).toString(encBase64);
  const token = uid2(16);
  // update user
  const user = await User.findByIdAndUpdate(
    req.body.user_id,
    {
      salt: salt,
      hash: hash,
      token: token,
    },
    { new: true }
  );
  res.json(user);
});

// udate user
router.patch("/user/update", isAuthentificated, async (req, res) => {
  // update user
  const user = await User.findByIdAndUpdate(
    req.body.user_id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    { new: true }
  );
  res.json(user);
});

module.exports = router;
