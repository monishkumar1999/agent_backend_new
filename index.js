const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const adminRoutes = require('./route/admin/adminRoutes');  // Import the admin routes
const cookieParser = require('cookie-parser');
const masterRouter = require('./route/admin/masters');
const roleMaster = require('./route/admin/role');
const describeRouter = require('./route/admin/describe_agency');
const serviceProvide = require('./route/admin/service_provide');
const durationRoute = require('./route/admin/duration_buyerAgreement');
const saleMethod = require('./route/admin/sale_method');
const specializeRoute = require('./route/admin/specialization');
const typicallyRoute = require('./route/admin/typicallywork');
const videoCalltechRoute = require('./route/admin/videoCallTech');
const digitalRoute = require('./route/admin/digitalSolution');
const propertyRoute = require('./route/admin/property');
const purchasePurpose = require('./route/admin/purchasePurpose');
const prefferedCommunicateRoute = require('./route/admin/preffredCommunicate');

require("dotenv").config();
const initializeSocket = require('./utils/socket');


const http = require('http');
const agentRouter = require('./route/agent/agentRoute');
const userRouter = require('./route/users/userRoute');
const usersRouter = require('./route/user/usersRoute');
const path = require('path');
const agentRouters = require('./route/mainAgent/AgentRout');

const app = express();

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));



// Configure CORS with dynamic origin handling
// Configure CORS with dynamic origin handling
const allowedOrigins = [
    "http://localhost:3000", // Development
    "http://13.203.235.203", // Your React app's origin
    "http://13.203.235.203:3000", // Replace with your React app's domain in production
  ];
  
  const corsOptions = {
    origin: (origin, callback) => {
      console.log("Request Origin:", origin);
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.error("CORS Error: Origin not allowed:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: "GET,POST,PUT,DELETE,OPTIONS",
    allowedHeaders: "Content-Type,Authorization",
    optionsSuccessStatus: 200,
    credentials: true, // If your app uses cookies or authentication
  };
  
  // Apply CORS middleware
  app.use(cors(corsOptions));
  
  // Explicitly handle preflight OPTIONS requests
  app.options("*", cors(corsOptions), (req, res) => {
    console.log("Handling OPTIONS request for:", req.url);
    res.status(200).end();
  });


const server = http.createServer(app);

initializeSocket(server);


app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.json());
app.use(cookieParser()); // ✅ Enables reading cookies


const mongoURI = "mongodb://buyeragentadmin:BuyerAgent2024@3.6.212.38:27017/buyeragentdb?retryWrites=true&w=majority"

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));


app.use('/admin', adminRoutes);
app.use('/master', masterRouter)

app.use('/roleMaster', roleMaster)
app.use('/describeMaster', describeRouter)
app.use('/serviceProvide', serviceProvide)
app.use('/salemethod', saleMethod)
app.use('/durationRoute', durationRoute)
app.use('/specalize', specializeRoute)
app.use('/typically', typicallyRoute)
app.use('/videoCalltech', videoCalltechRoute)
app.use('/digitalTech', digitalRoute)
app.use('/property', propertyRoute)
app.use('/purchase', purchasePurpose)
app.use('/communicate', prefferedCommunicateRoute)

// agent

app.use("/agent",agentRouter);
app.use("/user",userRouter)


app.use("/users",usersRouter)

app.use("/agents",agentRouters)


const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
