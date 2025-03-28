const Chat=require('../models/chat.model');
const Conversation=require('../models/conversation.model');

let addChat = async (req, res) => {
  try{

    const { car, owner, lastMessage, lastMessageTime } = req.body;
    const user = req.user;

    let findObject = { 
      "car._id": car._id,
      "user._id": user._id,
      "owner._id": owner._id
    };

    const existingChat = await Chat.findOne(findObject);
    if (existingChat) {
      return res.status(400).json({ status: false, message: "Chat already exists" });
    }

    console.log("add chat", car,
      user,
      owner);

    const newChat = new Chat({
      car,
      user,
      owner,
      lastMessage,
      lastMessageTime
    });
    await newChat.save();

    res.status(201).json({ status: true, message: "Chat added successfully", data: newChat });
  }
  catch(error){
    res.status(500).json({ status: false, message: error.message });
  }
}

let getChats = async (req, res) => {
  try{
    let userId = req.user._id;
    console.log("userId", userId);
    let chats = await Chat.find({ $or: [{ "user._id": userId }, { "owner._id": userId }] });
    res.status(200).json(chats);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

let addMessage = async (req, res) => {
  try{
    console.log("add message", req.body);
    let { message, imageUrl, isImage } = req.body;
    console.log("message", message);
    const chatId = req.params.id;
    const userId = req.user._id;
    const chat = await Chat.findOne({"_id": chatId, $or: [{ "user._id": userId }, { "owner._id": userId }] });
    if (!chat) {
      return res.status(404).json({ status: false, message: "Chat not found" });
    }
   
    let conversation=new Conversation({message,imageUrl, isImage, sender: userId, chatId});
    await conversation.save();
    res.status(200).json({ status: true, message: "Message added successfully", data: conversation });
  }
  catch(error){
    res.status(500).json({ status: false, message: error.message });
  }
}


let getConversations = async (req, res) => {
  try{
    let chatId = req.params.id;
    console.log("chatId", chatId);
    let conversations = await Conversation.find({ chatId });
    
    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error });
  }
}

module.exports = { addChat, getChats, addMessage, getConversations };