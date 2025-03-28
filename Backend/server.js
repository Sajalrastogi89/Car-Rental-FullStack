require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const express = require("express");
const connectDB = require("./config/db");
const passport = require("./config/passport.config");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const multer = require("multer");
const swaggerUi = require("swagger-ui-express");
const specs = require("./config/swagger");
const {getBidFromQueue} = require("./utils/sqs");



const app = express();
app.use(cookieParser());
app.use(passport.initialize());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Or set to your frontend domain
    methods: ["GET", "POST"]
  }
});
app.set("io", io);

io.on("connection", (socket) => {
  
  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
  });
  

  socket.on("sendMessage", (data) => {
    
    io.to(data.chatId).emit("newMessage", data);
  });
  
  socket.on("disconnect", () => {
    console.log("User disconnected :: ", socket.id);
  });
});

app.use(cors());



const authRoutes = require("./routes/auth.route");
const carRoutes = require("./routes/car.route");  
const biddingRoutes = require("./routes/bidding.route");
const bookingRoutes = require("./routes/booking.route");
const addNewFeildRoutes = require("./routes/field.route");
const chatRoutes = require("./routes/chat.route");
const analysisRoutes = require('./routes/analysis.route');

app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs)
);


// Routes
app.use("/api/auth", authRoutes); 
app.use("/api/car", carRoutes); 
app.use("/api/bidding", biddingRoutes);
app.use("/api/booking", bookingRoutes);
app.use("/api/field", addNewFeildRoutes);
app.use("/api/chat", chatRoutes);
app.use('/api/analysis', analysisRoutes);

app.post("/", (req, res) => {
  res.status(200).json({ message: "Login successful" });
});



// Start server
const PORT = process.env.PORT;
server.listen(PORT, () => {
  connectDB();
});

setInterval(getBidFromQueue, 3000);

