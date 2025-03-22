const express = require("express");
const { addCar, getCarById, getCars, getAllCarsByOwnerWithFilter, getCarsForUserWithFilter, deleteCar, updateCar } = require("../controllers/car.controller");
const carValidationRules = require("../middlewares/validateCarDetails");
const {uploadSingle, uploadToS3} = require("../middlewares/uploadMiddleware");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles= require("../middlewares/roleAuthenticate");

/**
 * @swagger
 * components:
 *   schemas:
 *     OwnerSubModel:
 *       type: object
 *       required:
 *         - _id
 *         - name
 *         - email
 *         - role
 *       properties:
 *         _id:
 *           type: string
 *           description: Owner's ID
 *         name:
 *           type: string
 *           description: Owner's name
 *         email:
 *           type: string
 *           description: Owner's email address
 *         role:
 *           type: string
 *           description: Owner's role (should be 'owner')
 *     
 *     
 *     CarUpdateInput:
 *       type: object
 *       properties:
 *         basePrice:
 *           type: number
 *           description: Base price for rental
 *         pricePerKm:
 *           type: number
 *           description: Price charged per kilometer
 *         outStationCharges:
 *           type: number
 *           description: Additional charges for outstation trips
 *         travelled:
 *           type: number
 *           description: Total kilometers travelled by the car
 *     
 *     Car:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Car ID
 *         carName:
 *           type: string
 *           description: Name of the car
 *         category:
 *           type: string
 *           description: Car category (SUV, Sedan, etc.)
 *         fuelType:
 *           type: string
 *           description: Type of fuel used
 *         basePrice:
 *           type: number
 *           description: Base price for rental
 *         pricePerKm:
 *           type: number
 *           description: Price charged per kilometer
 *         outStationCharges:
 *           type: number
 *           description: Additional charges for outstation trips
 *         travelled:
 *           type: number
 *           description: Total kilometers travelled by the car
 *         city:
 *           type: string
 *           description: City where the car is available
 *         imageUrl:
 *           type: string
 *           description: URL to car's image
 *         selectedFeatures:
 *           type: array
 *           items:
 *             type: string
 *           description: Special features of the car
 *         owner:
 *           $ref: '#/components/schemas/OwnerSubModel'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the car was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the car was last updated
 *     
 *     CarResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         car:
 *           $ref: '#/components/schemas/Car'
 *     
 *     CarInputForm:
 *       type: object
 *       properties:
 *         carName:
 *           type: string
 *         category:
 *           type: string
 *         fuelType:
 *           type: string
 *         basePrice:
 *           type: number
 *         pricePerKm:
 *           type: number
 *         outStationCharges:
 *           type: number
 *         city:
 *           type: string
 *         selectedFeatures:
 *           type: array
 *           items:
 *             type: string
 *         image:
 *           type: string
 *           format: binary
 */

const router = express.Router();

/**
 * @swagger
 * /api/car/addCar:
 *   post:
 *     summary: Add a new car
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/CarInputForm'
 *     responses:
 *       201:
 *         description: Car created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarResponse'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       500:
 *         description: Server error
 */
router.post("/addCar", 
  authenticateJWT,
  authorizeRoles("owner"),
  uploadSingle,
  uploadToS3, 
  carValidationRules,
  addCar
);



router.get("/getCars", 
  authenticateJWT,
  getCars
);

/**
 * @swagger
 * /api/car/carId/{id}:
 *   get:
 *     summary: Get a car by its ID
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the car
 *     responses:
 *       200:
 *         description: Car details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Car'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires user role
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */
router.get("/carId/:id",
  authenticateJWT,
  getCarById
);

/**
 * @swagger
 * /api/car/deleteCar/{id}:
 *   delete:
 *     summary: Delete a car
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the car to delete
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Car deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */
router.delete("/deleteCar/:id",
  authenticateJWT,
  authorizeRoles("owner"),
  deleteCar
);

/**
 * @swagger
 * /api/car/updateCar/{id}:
 *   put:
 *     summary: Update car details
 *     tags: [Cars]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the car to update
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CarUpdateInput'
 *     responses:
 *       200:
 *         description: Car updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CarResponse'
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - requires owner role
 *       404:
 *         description: Car not found
 *       500:
 *         description: Server error
 */
router.patch("/updateCar/:id",
  authenticateJWT,
  authorizeRoles("owner"),
  updateCar
);

module.exports = router;