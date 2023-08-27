const User = require("../models/User");

const isAuthentificated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      const user = await User.findOne({
        token: req.headers.authorization.replace("Bearer ", ""),
      });
      if (user) {
        req.user = user;
        next();
      } else {
        console.log("Route interdite faute d'authentification");
        res.status(401).json({ status: "denied" });
      }
    } else {
      console.log("Route interdite faute d'authentification");
      res.status(401).json({ status: "denied" });
    }
  } catch (error) {
    res.status(400).json("athentification error: ", error.message);
  }
};

module.exports = isAuthentificated;
