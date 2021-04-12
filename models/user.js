const Joi = require("joi");
const mongoose = require("mongoose");
const config = require("config");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  dateJoined: { type: Date, required: true, default: Date.now },
  firstName: { type: String, required: true, minlength: 1, maxlength: 64 },
  lastName: { type: String, required: true, minlength: 1, maxlength: 64 },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: 8, maxlength: 1024 },
  hasCovid: { type: Boolean, required: true, default: false },
  lastExposed: { type: Date, required: false },
  vaccination: {
    type: { type: String, enum: ["moderna", "pfizer", "j&j", "other"] },
    firstVac: { type: Date },
    secondVac: { type: Date },
    required: false,
  },
  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  ],
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

const User = mongoose.model("User", userSchema);

const validate = (user) => {
  const schema = Joi.object({
    firstName: Joi.string().required().label("First Name").min(1).max(64),
    lastName: Joi.string().required().label("Last Name").min(1).max(64),
    email: Joi.string().email().required().label("Email"),
    password: Joi.string().required().label("Password").min(8).max(1024),
  });
  return schema.validate(user);
};

const validateVac = (vac) => {
  const schema = Joi.object({
    type: Joi.string().required().valid("moderna", "pfizer", "j&j", "other"),
    firstVac: Joi.date(),
    secondVac: Joi.date(),
  });
  return schema.validate(vac);
};

exports.User = User;
exports.validate = validate;
exports.validateVac = validateVac;
