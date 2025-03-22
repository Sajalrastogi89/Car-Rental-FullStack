const express = require('express');
const { addCategory, addFeature, addFuelType, addCity, getCategories, getFeatures, getFuelTypes, getCities } = require('../controllers/field');
const router = express.Router();

router.post("/addNewCategory", addCategory);
router.post("/addNewFeature", addFeature);
router.post("/addNewFuelType", addFuelType);
router.post("/addNewCity", addCity);


router.get("/getCategories", getCategories);
router.get("/getFeatures", getFeatures);
router.get("/getFuelTypes", getFuelTypes);
router.get("/getCities", getCities);

module.exports = router;