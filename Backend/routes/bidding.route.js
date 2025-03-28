const express = require("express");
const{addBid, acceptBid, rejectBid, getAllBids} = require("../controllers/bidding.controller");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");
const validateBidDetails=require("../middlewares/validateBid");


const router=express.Router();

router.get("/getAllBids", authenticateJWT,  getAllBids);
router.post("/addBidding", authenticateJWT, authorizeRoles("user"), validateBidDetails, addBid);
router.post("/acceptBid/:id", authenticateJWT, authorizeRoles("owner"), acceptBid);
router.put("/rejectBid/:id", authenticateJWT, authorizeRoles("owner"), rejectBid);

module.exports=router;