const express = require("express");
const validateSignup = require("../middlewares/validateSignup");
const validateLogin = require("../middlewares/validateLogin");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const { login, signup, profile } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", validateLogin, login);
router.post("/signup", validateSignup, signup);
router.get("/profile", authenticateJWT, profile);

module.exports = router;
