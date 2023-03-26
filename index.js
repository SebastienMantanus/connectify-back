require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DATABASE_URI_ONLINE);

// import des routes
const usersRoutes = require("./routes/users");
app.use(usersRoutes);

const affiliatesRoutes = require("./routes/affiliates");
app.use(affiliatesRoutes);

// routes principales
// app.get("/", (req, res) => {
//   res.json({ message: "Hi, welcome to my Affiliate Backend" });
// });

// app.get("/hello", (req, res) => {
//   res.json({ message: "Hello" });
// });

// app.all("*", function (req, res) {
//   res.json({ message: "Page not found" });
// });

app.listen(process.env.PORT, () => {
  console.log("Server has started 🥵");
});
