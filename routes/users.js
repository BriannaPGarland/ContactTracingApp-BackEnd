const mongoose = require("mongoose");
const express = require("express");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

const router = express.Router();

const { User, validate } = require("../models/user");
const auth = require("../middleware/auth");

router.get("/", async (req, res) => {
  const users = await User.find().sort("lastName");
  res.send(users);
});

router.get("/me", [auth], async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  res.send(user);
});

router.post("/", async (req, res) => {
  // validate input
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // Check if user email already exists
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("This email is already registered.");

  // Create new user and encrypt password
  user = new User(
    _.pick(req.body, ["firstName", "lastName", "email", "password"])
  );

  // encrypt password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  // save user into database
  user = await user.save();

  const token = user.generateAuthToken();

  res
    .status(201)
    .header("x-auth-token", token)
    .header("access-control-expose-headers", "x-auth-token")
    .send(
      _.pick(user, [
        "_id",
        "firstName",
        "lastName",
        "email",
        "friends",
        "hasCovid",
        "dateJoined",
      ])
    );
});

module.exports = router;
