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
    firstVac: { type: Date, required: true },
    secondVac: { type: Date, required: false },
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

userSchema.methods.generateAuthToken = () => {
  const token = jwt.sign(
    {
      _id: this._id,
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
    },
    config.get("jwtPrivateKey")
  );
  return token;
};

validate = (user) => {
  const schema = {
    firstName: Joi.string().required().label("First Name").min(1).max(64),
    lastName: Joi.string().required().label("Last Name").min(1).max(64),
    email: Joi.string().email({ minDomainAtoms: 2 }).required().label("Email"),
    password: Joi.string().required().label("Password").min(8).max(1024),
  };
  return Joi.validate(user, schema);
};

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.validate = validate;
