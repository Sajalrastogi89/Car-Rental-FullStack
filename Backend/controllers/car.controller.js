const { validationResult } = require("express-validator");
const Car=require('../models/car.model');


/**
 * @description Add a new car
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let addCar = async (req, res) => {
  try{ 
    console.log("req.body add car", req.body);
    // check validation middleware result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    
      return res.status(400).json({ status: false, errors: errors.array() });
    }
   
    // deconstruct details from request body
 



    let { carName, category, fuelType, basePrice, pricePerKm, outStationCharges, travelled, city, imageUrl, features } = req.body;
   
    features=JSON.parse(features);
   

    city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();

    // create car object
    let carObject = { 
      carName, category, fuelType, basePrice, pricePerKm, outStationCharges, travelled, city, imageUrl, features,
       owner: {_id: req.user._id, role: req.user.role, name: req.user.name, phone:req.user.phone, email: req.user.email} 
      };

  

    // save car
    let car = new Car(carObject);
    let addedCar=await car.save();
    // send response
    res.status(201).json({ status: true, message: "Car created", car: addedCar });
  }
  catch (error) {

    // send error response
    res.status(500).json({ status: false, message: error.message });
  }
};




/**
 * @description Get car by id
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let getCarById = async (req, res) => {
  try {

    let findObject = {_id: req.params.id, isDisabled: false};

    // find car by id
    let car = await Car.findOne(findObject);
    if (!car) return res.status(404).json({ status: false, message: "Car not found" });

    console.log("car", car);
    // send response
    res.status(200).json({ status: true, car });
  } catch (error) {

    // send error response
    res.status(500).json({ status: false, message: error.message });
  }
}



/**
 * @description Get cars
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let getCars = async (req, res) =>{
  try{
 
    // deconstruct query parameters
    let {carName, city, category, fuelType, sortBy = "createdAt", sortOrder = 1, page = 1, limit = 10}=req.query;

    // create query object
    let query={isDisabled: false};
    if(city) query.city=city;
    if(category) query.category=category;
    if(fuelType) query.fuelType=fuelType;
    if(carName && carName.trim()) {
      query.carName = { $regex: carName, $options: 'i' };
    }

    let user=req.user;

    if(user.role==="owner"){
      query["owner._id"]=user._id;
    }

    // convert values from string to int
    page=parseInt(page);
    limit=parseInt(limit);
    sortOrder=parseInt(sortOrder);


    // sorting
    let sortObject={};
    sortObject[sortBy]=sortOrder;
    // aggregation pipeline for filtering, sorting, paginating
    const pipeline = [
      { $match: query },
      { $sort: sortObject },
      { $facet : {
        metadata: [ { $count: "total" }, { $addFields: { page: page, limit: limit } } ],
        data: [ { $skip: (page - 1) * limit }, { $limit: limit } ]
      } },
    ];
    
    // get cars
    let carsData=await Car.aggregate(pipeline);
  
    // send response
    res.status(200).json({status: true, cars: carsData[0].data, metadata: carsData[0].metadata[0]});
    // res.status(200).json({status: true, cars: carsData});
  }
  catch(error){
    res.status(500).json({status: false, message: error.message});
  }
}

/**
 * @description Delete car
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let deleteCar = async (req,res) =>{
  try{

 

    // create find object
    let findObject = {_id: req.params.id, "owner._id": req.user._id, isDisabled: false};

    // delete car
    let car=await Car.findOneAndUpdate(findObject, {$set: {isDisabled: true}}, {new: true});
    if(!car) return res.status(404).json({status: false, message: "Car not found"});

    // send response
    res.status(200).json({status: true, message: "Car disabled", car: car});
  }
  catch(error){

    // send error response
    res.status(500).json({status: false, message: error.message});
  }
}


/**
 * @description Update car details
 * @param {object} req - Request object
 * @param {object} res - Response object
 */
let updateCar = async (req,res) => {
  try{

    // deconstruct details from request body
    let {basePrice, pricePerKm, outStationCharges, travelled}=req.body;

    // create update object
    let updateObject={};

    if(basePrice) updateObject.basePrice=basePrice;
    if(pricePerKm) updateObject.pricePerKm=pricePerKm;
    if(outStationCharges) updateObject.outStationCharges=outStationCharges;
    if(travelled) updateObject.travelled=travelled;

    // create find object
    let findObject = {_id: req.params.id, "owner._id": req.user._id, isDisabled: false};

    // update car
    let car=await Car.findOneAndUpdate(findObject, {$set: updateObject}, {new: true});
    if(!car) return res.status(404).json({status: false, message: "Car not found"});

    // send response
    res.status(200).json({status: true, message: "Car updated", car});

  }
  catch(error){

    // send error response
    res.status(500).json({status: false, message: error.message});
  }
}



module.exports = { addCar, getCarById, getCars , deleteCar, updateCar };