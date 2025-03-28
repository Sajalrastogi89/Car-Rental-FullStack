const express = require("express");
const { addCar, getCarById, getCars, getAllCarsByOwnerWithFilter, getCarsForUserWithFilter, deleteCar, updateCar } = require("../controllers/car.controller");
const carValidationRules = require("../middlewares/validateCarDetails");
const {uploadSingle, optionalUploadSingle, uploadToS3} = require("../middlewares/uploadMiddleware");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles= require("../middlewares/roleAuthenticate");

const router = express.Router();

router.get("/getCars", authenticateJWT, getCars);
router.get("/carId/:id", authenticateJWT, getCarById);
router.post("/addCar", authenticateJWT, authorizeRoles("owner"), optionalUploadSingle, uploadToS3,(req,res,next)=>{console.log("req.body route", req.body); next();} ,carValidationRules, addCar); 
router.post("/deleteCar/:id", authenticateJWT, authorizeRoles("owner"), deleteCar);
router.patch("/updateCar/:id", authenticateJWT, authorizeRoles("owner"), updateCar);

module.exports = router;