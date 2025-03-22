const express = require("express");
const validateSignup = require("../middlewares/validateSignup");
const validateLogin = require("../middlewares/validateLogin");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const { login, signup, profile, logout } = require("../controllers/auth.controller");
const authorizeRoles = require("../middlewares/roleAuthenticate");

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - password
 *         - role
 *         - phone
 *       properties:
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *         role:
 *           type: string
 *           description: User's role
 *         phone:
 *           type: number
 *           description: User's phone number
 *         verified:
 *           type: boolean
 *           description: Whether user's account is verified
 *     LoginCredentials:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         name:
 *           type: string
 *         email:
 *           type: string
 *         role:
 *           type: string
 *         phone:
 *           type: number
 *         verified:
 *           type: boolean
 *     AuthResponse:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: JWT authentication token
 *         user:
 *           $ref: '#/components/schemas/UserResponse'
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/User'
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input or validation failed
 *       500:
 *         description: Server error
 */
router.post("/signup", validateSignup, signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login to get access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginCredentials'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post("/login", validateLogin, login);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get user profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires user role
 *       500:
 *         description: Server error
 */
router.get("/profile", authenticateJWT, profile);

router.post("/logout", authenticateJWT, logout);

module.exports = router;
