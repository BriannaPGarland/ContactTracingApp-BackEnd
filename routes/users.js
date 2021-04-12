const mongoose = require("mongoose");
const express = require("express");
const _ = require("lodash");
const bcrypt = require("bcryptjs");

const router = express.Router();

const {
  User,
  validate,
  validateVac,
  validateCovidStatus,
} = require("../models/user");
const auth = require("../middleware/auth");

router.get("/", [auth], async (req, res) => {
  const users = await User.find().select("-password -__v").sort("lastName");
  res.send(users);
});

router.get("/me", [auth], async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");
  res.send(user);
});

router.get("/friends", [auth], async (req, res) => {
  const user = await User.findById(req.user._id).select("-password -__v");

  const friends = await User.find(
    {
      _id: user.friends,
    },
    ["_id", "firstName", "lastName", "hasCovid", "lastExposed", "vaccination"]
  );

  res.send(friends);
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

router.post("/add-friend/:id", [auth], async (req, res) => {
  if (req.params.id === req.user._id)
    return res.status(400).send("You cannot add yourself as a friend.");

  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user)
    return res
      .status(400)
      .send("The user with the given ID could not be found.");

  const friend = await User.findById(req.params.id);
  if (!friend)
    return res
      .status(400)
      .send("The user with the given ID could not be found.");

  user.friends.push(friend._id);

  await user.save();

  res.status(200).send("Friend added.");
});

router.post("/remove-friend/:id", [auth], async (req, res) => {
  if (req.params.id === req.user._id)
    return res
      .status(400)
      .send("You cannot remove yourself from your friend's list.");

  const user = await User.findById(req.user._id).select("-password -__v");
  if (!user)
    return res
      .status(400)
      .send("The user with the given ID could not be found.");

  const index = user.friends.indexOf(req.params.id);
  if (index === -1)
    return res.status(400).send("This user is not currently your friend.");

  user.friends.splice(index, 1);

  await user.save();

  res.status(200).send("Friend removed.");
});

router.put("/add-vaccination", [auth], async (req, res) => {
  const { error } = validateVac(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findByIdAndUpdate(req.user._id, {
    vaccination: req.body,
  });
  if (!user)
    return res.status(404).send("The user with the given ID was not found.");

  res.status(200).send("Vaccination added.");
});

router.put("/covid-status", [auth], async (req, res) => {
  const { error } = validateCovidStatus(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const user = await User.findByIdAndUpdate(
    req.user._id,
    _.pick(req.body, ["hasCovid", "lastExposed"])
  );
  if (!user)
    return res
      .status(400)
      .send("The user with the given ID could not be found.");

  res.status(200).send("Status updated.");
});

router.delete("/me", [auth], async (req, res) => {
  await User.findOneAndDelete(req.user._id);
  res.send("User deleted successfully.");
});

module.exports = router;
