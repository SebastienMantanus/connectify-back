const User = require("../models/User");

const isAuthentificated = async (req, res, next) => {
  console.log("hello isAuthentificated !");
  try {
    if (req.headers.authorization) {
      const user = await User.findOne({
        token: req.headers.authorization.replace("Bearer ", ""),
      });
      if (user) {
        console.log("connexion autorisée !");
        req.user = user;
        next();
      } else {
        console.log("Route interdite faute d'authentification");
        res.status(200).json({ status: "denied" });
      }
    } else {
      console.log("Route interdite faute d'authentification");
      res.status(200).json({ status: "denied" });
    }
  } catch (error) {
    res.status(400).json("athentification error: ", error.message);
  }
};

module.exports = isAuthentificated;
