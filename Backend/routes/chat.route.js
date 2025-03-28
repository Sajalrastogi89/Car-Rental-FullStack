const express = require("express");
const { getChats, addChat, addMessage, getConversations } = require("../controllers/chat.controller");
const authenticateJWT = require("../middlewares/jwtTokenAuthenticate");
const authorizeRoles = require("../middlewares/roleAuthenticate");
const {optionalUploadSingle, uploadToS3} = require("../middlewares/uploadMiddleware");

const router = express.Router();
 

router.get("/getChats", authenticateJWT, getChats);
router.post("/addNewChat", (req, res, next)=>{console.log("req.body",req.body); next();}, authenticateJWT, authorizeRoles("user"), addChat);
router.get("/getConversation/:id", authenticateJWT, getConversations);
router.post("/sendMessage/:id", authenticateJWT, optionalUploadSingle, uploadToS3,(req,res,next)=>{console.log("send message", req.body); next();}, addMessage);

module.exports = router; 