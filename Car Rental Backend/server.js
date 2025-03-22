require('dotenv').config();
const express = require("express");
const connectDB = require("./config/db");
const passport = require("./config/passport.config");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const specs = require("./config/swagger");

const authRoutes = require("./routes/auth.route");
const carRoutes = require("./routes/car.route");  
const biddingRoutes = require("./routes/bidding.route");
const bookingRoutes = require("./routes/booking.route");
const addNewFeildRoutes = require("./routes/field.route");


const app = express();
app.use(cookieParser());
app.use(passport.initialize());


app.use(cors({
  origin: "http://127.0.0.1:8000",
  credentials: true 
}));

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


// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});

