const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require("dotenv").config();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.DATABASE_URI_ONLINE);

// import des routes
const usersRoutes = require("./routes/users");
app.use(usersRoutes);

const affiliatesRoutes = require("./routes/affiliates");
app.use(affiliatesRoutes);

const foldersRoutes = require("./routes/folders");
app.use(foldersRoutes);

const statusRoutes = require("./routes/status");
app.use(statusRoutes);

const notesRoutes = require("./routes/notes");
app.use(notesRoutes);

// routes principales
app.get("/", (req, res) => {
  res.status(200).json({ message: "Hi, welcome to Connectify Backend" });
});

app.listen(process.env.PORT, () => {
  console.log("Server has started");
});
