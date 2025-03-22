const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");

/**
 * @description Login a user
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let login = async (req, res) => {
  try {

    // check validation middleware result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // deconstruct details from request body
    const { email, password } = req.body;

    // check if user exists 
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({status: false, message: "Invalid email" });

    // check if password is correct
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) return res.status(400).json({status: false, message: "Invalid password" });

    // generate jwt token
    const token = jwt.sign(
      { id: user.id.toString(), email: user.email, role: user.role },
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE }
    );

    // remove password from response
    let userData = user.toObject();
    delete userData.password;

    // send response
    res
    .cookie("jwt", token, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000  })
    .status(200).json({ status: true, user: userData })
    

  } catch (error) {

    // send error response
    res.status(500).json({ status: false, message: "Server error" });

  }
};






/**
 * @description Register a new user
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let signup = async (req, res) => {
  try {

    // check validation middleware result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({status:false, message: "Data validation fails" ,errors: errors.array() });
    }

    // deconstruct details from request body
    let { name, email, password, role, phone, verified } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({status: false, message: "User already exists" });

    // create User object
    user = new User({ name, email, password, role, phone, verified });
    let savedObject = await user.save();

    // remove password from response
    let userObject = savedObject.toObject();
    delete userObject.password;

    // send response
    res.status(201).json({status:true, message: "User created", user: userObject });
  } catch (error) {

    // send error response
    res.status(500).json({ status: false, message: "Server error" });
  }
};




/**
 * @description Get user profile information
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let profile = function (req, res) {
  try{
    let userData = req.user.toObject();
    delete userData.password;
    res.status(200).json({status: true, userData});
  } catch (error) {
    res.status(500).json({status: false, message: "Server error" });
  }
};


let logout = function (req, res) {
  try {
  res.clearCookie("jwt", {httpOnly: true} )
  .status(200).json({status: true, message: "Logout successfully"});
  } catch (error) {
    res.status(500).json({status: false, message: "Server error" });
  }
};

module.exports = { login, signup, profile, logout };
