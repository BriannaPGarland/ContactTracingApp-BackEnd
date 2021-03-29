const express = require("express");

const users = require("../routes/users");
const auth = require("../routes/auth");

const error = require("../middleware/error");

module.exports = (app) => {
  app.use(express.json());

  app.use("/api/users", users);
  app.use("/api/auth", auth);

  app.use(error);
};
