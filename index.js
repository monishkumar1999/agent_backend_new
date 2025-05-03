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
const { chatRouter } = require('./route/chatRouter');

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

// const corsOptions = {
//     origin: '*', // Allow requests from any origin
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // HTTP methods you want to allow
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted-Data'], // Allow custom headers
//     credentials: true // Allow cookies and credentials (Note: With origin: '*', credentials may not work as expected)
// };

// const corsOptions = {
//     origin: ['https://agentmatchr.com', "*"], // Replace with your allowed origins
//     methods: ['GET', 'POST', 'PUT', 'DELETE'], // HTTP methods you want to allow
//     allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted-Data'], // Allow custom headers
//     credentials: true // Allow cookies and credentials
// };





// MongoDB connection string
// const mongoURI = 'mongodb://buyeragentadmin:BuyerAgent2024@3.6.212.38:27017/buyeragentdb?authSource=admin';

const mongoURI = "mongodb://buyeragentadmin:BuyerAgent2024@3.6.212.38:27017/buyeragentdb?retryWrites=true&w=majority"

// Connect to MongoDB
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err));

// Define the UserRequest schema and model
const userRequestSchema = new mongoose.Schema({
    bedroomCount: { type: String, required: true },
    emailAddress: { type: String, required: true },
    isAssistance: { type: Boolean, required: true },
    isLegalReady: { type: Boolean, required: true },
    location: { type: String, required: true },
    phoneNumber: { type: String, required: true },
    propertyType: { type: String, required: true },
    selectedOption: { type: String, required: true },
    selectedPurpose: { type: String, required: true },
    selectedUserCommunication: { type: String, required: true },
    weeklyOrSaleValue: { type: String, required: true },
    buyerAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerAgent', required: true },
    isAccepted: { type: Boolean, default: false }
}, { timestamps: true });


const proposalSchema = new mongoose.Schema({

    aboutAgency: { type: String, required: true },
    aboutYou: { type: String, required: true },
    clientTypes: { type: [String], required: true },
    negotiationApproach: { type: String, required: true },
    otherSolution: { type: String, default: '' },
    otherTech: { type: String, default: '' },
    postcodes: { type: [String], required: true },
    saleAuthority: { type: String, required: true },
    salesMethod: { type: [String], required: true },
    salesTeamSize: { type: String, required: true },
    selectedSolutions: { type: [String], default: [] },
    selectedTech: { type: [String], default: [] },
    services: { type: [String], required: true },
    specializations: { type: [String], required: true },
    videoCallOption: { type: String, required: true },

}, { timestamps: true });
// Define the BuyerAgent schema
const buyerAgentSchema = new mongoose.Schema({
    agencyDescription: { type: String, required: true },
    agencyName: { type: String, required: true },
    branch: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    officeAddress: { type: String, required: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    role: { type: [String], required: true },
    proposals: [proposalSchema],
    userImage: { type: String, required: false },
    agencyLogo: { type: String, required: false },
    otpCode: { type: String, required: false },
    otpExpires: { type: Date, required: false },
    imageUrl: { type: String, default: "" },
    agencyImageUrl: { type: String, default: "" }
}, { timestamps: true });




// Define the otpVerification schema
const otpVerificationSchema = new mongoose.Schema({
    otpCode: { type: String, required: false },
    otpExpires: { type: Date, required: false },
    email: { type: String, required: true, unique: true },
}, { timestamps: true });

const UserRequest = mongoose.model('UserRequest', userRequestSchema);

// Create the OTP verification model
const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

const BuyerAgent = mongoose.model('BuyerAgent', buyerAgentSchema);

// Middleware to authenticate token
// const authenticateToken = (req, res, next) => {
//     const authHeader = req.headers['authorization'];
//     const token = authHeader && authHeader.split(' ')[1];

//     if (token == null) {
//         return res.status(401).json({ code: 0, message: 'Unauthorized', data: null });
//     }

//     jwt.verify(token, JWT_SECRET, (err, user) => {
//         if (err) {
//             return res.status(403).json({ code: 0, message: 'Forbidden', data: null });
//         }
//         req.user = user;
//         next();
//     });
// };


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

// chat 

app.use("/chat",chatRouter)
const authenticateToken = (req, res, next) => {
    const token = req.body.token;

    if (!token) {
        return res.status(401).json({ code: 0, message: 'Access Denied: No Token Provided' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.buyerAgentId = decoded.userId; // Assuming `userId` is stored as `buyerAgentId` in the token
        next();
    } catch (error) {
        return res.status(403).json({ code: 0, message: 'Invalid Token' });
    }
};



app.get('/test', (req, res) => {
    res.status(500).json({
        code: 1,
        message: 'Connection successful',
    });
})


app.post('/api/userRequest', async (req, res) => {


    try {

        console.log(req.body, "body");
        const {
            bedroomCount,
            emailAddress,
            isAssistance,
            isLegalReady,
            location,
            phoneNumber,
            propertyType,
            selectedOption,
            selectedPurpose,
            selectedUserCommunication,
            weeklyOrSaleValue,
            buyerAgentId,
            isAccepted
        } = req.body;
        // Check if a request from this email to the same buyer agent already exists
        const existingRequest = await UserRequest.findOne({ emailAddress, buyerAgentId });
        if (existingRequest) {
            return res.status(400).json({
                code: 0,
                message: 'A request from this email address to this buyer agent already exists.',
                data: null
            });
        }

        // Create a new user request document
        const newUserRequest = new UserRequest({
            bedroomCount,
            emailAddress,
            isAssistance,
            isLegalReady,
            location,
            phoneNumber,
            propertyType,
            selectedOption,
            selectedPurpose,
            selectedUserCommunication,
            weeklyOrSaleValue,
            buyerAgentId,
            isAccepted: isAccepted || false
        });

        // Save the request to the database
        await newUserRequest.save();

        res.status(201).json({
            code: 1,
            message: 'User request created successfully',
            data: newUserRequest
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

app.post('/api/buyerAgent/requests', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(401).json({
                code: 0,
                message: 'No token provided',
                data: null
            });
        }


        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        // Find all requests for the authenticated buyer agent
        const requests = await UserRequest.find({ buyerAgentId: decoded.userId });

        res.status(200).json({
            code: 1,
            message: 'Requests retrieved successfully',
            data: requests
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

// API to send a verification code to an email address
app.post('/api/sendCode', async (req, res) => {
    const { email } = req.body;

    try {
        // Generate the OTP
        const otpCode = generateOtp();

        // Set OTP expiration time (20 minutes from now)
        const otpExpires = Date.now() + 20 * 60 * 1000; // 20 minutes

        // Check if the email already exists in otpVerification collection
        let existingOtp = await OtpVerification.findOne({ email });

        if (existingOtp) {
            // Update existing record with new OTP and expiry
            existingOtp.otpCode = otpCode;
            existingOtp.otpExpires = new Date(otpExpires);
            await existingOtp.save();
        } else {
            // Create new OTP verification record
            const newOtpVerification = new OtpVerification({
                email,
                otpCode,
                otpExpires: new Date(otpExpires)
            });
            await newOtpVerification.save();
        }

        // Set up email options
        const mailOptions = {
            from: 'digitowls10@gmail.com', // Sender email
            to: email, // Recipient email
            subject: 'Your Verification Code',
            text: `Your verification code is: ${otpCode}` // The content of the email
        };

        // Send the email
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return res.status(500).json({
                    code: 0,
                    message: 'Failed to send email',
                    data: null
                });
            } else {
                console.log('Email sent: ' + info.response);
                return res.status(200).json({
                    code: 1,
                    message: 'Code sent to email successfully',
                    data: { email }
                });
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Failed to generate OTP',
            data: null
        });
    }
});

// API to verify the OTP code
app.post('/api/verifyCode', async (req, res) => {
    const { email, otpCode } = req.body;

    try {
        // Find the otpVerification record by email
        const otpRecord = await OtpVerification.findOne({ email });

        if (!otpRecord) {
            return res.status(404).json({
                code: 0,
                message: 'No OTP found for this email',
                data: null
            });
        }

        // Check if the OTP is valid and not expired
        if (otpRecord.otpCode === otpCode && otpRecord.otpExpires > Date.now()) {
            // Clear the OTP after successful verification
            await OtpVerification.updateOne({ email }, { $unset: { otpCode: 1, otpExpires: 1 } });

            return res.status(200).json({
                code: 1,
                message: 'OTP verified successfully',
                data: null
            });
        } else {
            return res.status(400).json({
                code: 0,
                message: 'Invalid or expired OTP',
                data: null
            });
        }
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

// API 1: Create Buyer Agent
app.post('/api/buyerAgent/create', async (req, res) => {
    const {
        agencyDescription,
        agencyName,
        branch,
        email,
        firstName,
        lastName,
        officeAddress,
        password,
        phone,
        role
    } = req.body;

    try {
        // Check if email already exists
        let existingAgent = await BuyerAgent.findOne({ email });
        if (existingAgent) {
            return res.status(400).json({ code: 0, message: 'Email already exists', data: null });
        }

        // Hash the password before saving the buyer agent
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new buyer agent
        const newBuyerAgent = new BuyerAgent({
            agencyDescription,
            agencyName,
            branch,
            email,
            firstName,
            lastName,
            officeAddress,
            password: hashedPassword, // Store the hashed password
            phone,
            role
        });

        // Save the new buyer agent
        await newBuyerAgent.save();

        // Create a JWT token (store essential user info, e.g., _id, email)
        const token = jwt.sign(
            { userId: newBuyerAgent._id, email: newBuyerAgent.email },
            JWT_SECRET,
            { expiresIn: '1h' } // Token will expire in 1 hour
        );

        // Return the token and user information
        res.status(201).json({
            code: 1,
            message: 'Buyer agent created successfully',
            data: {
                user: newBuyerAgent,
                token: token
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

// API 2: Create Proposal for Buyer Agent
app.post('/api/proposal/create', async (req, res) => {
    try {
        // const { token } = req.body;
        const {
            aboutAgency,
            aboutYou,
            clientTypes,
            negotiationApproach,
            otherSolution,
            otherTech,
            postcodes,
            saleAuthority,
            salesMethod,
            salesTeamSize,
            selectedSolutions,
            selectedTech,
            services,
            specializations,
            videoCallOption,
            token

        } = req.body;

        if (!token) {
            return res.status(401).json({
                code: 0,
                message: 'No token provided',
                data: null
            });
        }


        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        // console.log(decoded);



        try {
            // Find the buyer agent by userId
            let buyerAgent = await BuyerAgent.findById(decoded.userId);
            if (!buyerAgent) {
                return res.status(404).json({
                    code: 0,
                    message: 'Buyer agent not found',
                    data: null
                });
            }

            // Create the new proposal
            const newProposal = {
                aboutAgency,
                aboutYou,
                clientTypes,
                negotiationApproach,
                otherSolution,
                otherTech,
                postcodes,
                saleAuthority,
                salesMethod,
                salesTeamSize,
                selectedSolutions,
                selectedTech,
                services,
                specializations,
                videoCallOption
            };

            // Add the new proposal to the buyer agent's proposals array
            buyerAgent.proposals.push(newProposal);

            // Save the updated buyer agent document
            await buyerAgent.save();
            res.status(201).json({
                code: 1,
                message: 'Proposal created successfully',
                data: newProposal
            });
        } catch (error) {
            res.status(500).json({
                code: 0,
                message: 'Server Error',
                data: null
            });
        }
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
}
);

// API 3: Update an Existing Proposal
app.put('/api/proposal/update', async (req, res) => {
    // const { userId, proposalId } = req.params;
    const {
        aboutAgency,
        aboutYou,
        clientTypes,
        negotiationApproach,
        otherSolution,
        otherTech,
        postcodes,
        saleAuthority,
        salesMethod,
        salesTeamSize,
        selectedSolutions,
        selectedTech,
        services,
        specializations,
        videoCallOption,
        userId,
        proposalId
    } = req.body;

    try {
        // Find the buyer agent by userId
        let buyerAgent = await BuyerAgent.findById(userId);
        if (!buyerAgent) {
            return res.status(404).json({
                code: 0,
                message: 'Buyer agent not found',
                data: null
            });
        }

        // Find the proposal by proposalId
        let proposal = buyerAgent.proposals.id(proposalId);
        if (!proposal) {
            return res.status(404).json({
                code: 0,
                message: 'Proposal not found',
                data: null
            });
        }

        // Update the proposal with the new data
        proposal.aboutAgency = aboutAgency;
        proposal.aboutYou = aboutYou;
        proposal.clientTypes = clientTypes;
        proposal.negotiationApproach = negotiationApproach;
        proposal.otherSolution = otherSolution;
        proposal.otherTech = otherTech;
        proposal.postcodes = postcodes;
        proposal.saleAuthority = saleAuthority;
        proposal.salesMethod = salesMethod;
        proposal.salesTeamSize = salesTeamSize;
        proposal.selectedSolutions = selectedSolutions;
        proposal.selectedTech = selectedTech;
        proposal.services = services;
        proposal.specializations = specializations;
        proposal.videoCallOption = videoCallOption;

        // Save the updated buyer agent document
        await buyerAgent.save();
        res.status(200).json({
            code: 1,
            message: 'Proposal updated successfully',
            data: proposal
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

app.post('/api/user/info', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(401).json({
            code: 0,
            message: 'No token provided',
            data: null
        });
    }

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);

        // Find the user using the userId stored in the token
        const user = await BuyerAgent.findById(decoded.userId);

        if (!user) {
            return res.status(404).json({
                code: 0,
                message: 'User not found',
                data: null
            });
        }

        // Return the user information
        res.status(200).json({
            code: 1,
            message: 'User information retrieved successfully',
            data: user
        });

    } catch (error) {
        res.status(401).json({
            code: 0,
            message: 'Invalid token',
            data: null
        });
    }
});


// API to login
app.post('/api/buyerAgent/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find the buyer agent by email
        let buyerAgent = await BuyerAgent.findOne({ email });
        if (!buyerAgent) {
            return res.status(400).json({
                code: 0,
                message: 'Invalid email or password',
                data: null
            });
        }

        // console.log(password);
        // console.log(buyerAgent.password);


        // Validate the password
        const isMatch = await bcrypt.compare(password, buyerAgent.password);
        if (isMatch) {
            return res.status(400).json({
                code: 0,
                message: 'Invalid email or password',
                data: null
            });
        }

        // Create a JWT token
        const token = jwt.sign(
            { userId: buyerAgent._id, email: buyerAgent.email },
            JWT_SECRET
        );

        // Return the token and user information
        res.status(200).json({
            code: 1,
            message: 'Login successful',
            data: {
                token: token,
                user: buyerAgent
            }
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

app.post('/api/buyerAgent/changePassword', async (req, res) => {
    const { token, currentPassword, newPassword, confirmNewPassword } = req.body;

    // Ensure new password and confirm new password match
    if (newPassword !== confirmNewPassword) {
        return res.status(400).json({
            code: 0,
            message: 'New password and confirm new password do not match',
            data: null
        });
    }

    try {
        // Verify the token and extract user ID
        const decoded = jwt.verify(token, JWT_SECRET);
        const userId = decoded.userId;

        // Find the user by ID
        const buyerAgent = await BuyerAgent.findById(userId);
        if (!buyerAgent) {
            return res.status(404).json({
                code: 0,
                message: 'User not found',
                data: null
            });
        }

        // Validate the current password
        const isMatch = await bcrypt.compare(currentPassword, buyerAgent.password);
        if (!isMatch) {
            return res.status(400).json({
                code: 0,
                message: 'Current password is incorrect',
                data: null
            });
        }

        // Hash the new password before saving
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        buyerAgent.password = hashedNewPassword;
        await buyerAgent.save();

        res.status(200).json({
            code: 1,
            message: 'Password changed successfully',
            data: null
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});


// Create an API endpoint to get all buyer agents
// app.get('/api/allBuyerAgents', async (req, res) => {
//     try {
//         // Find all buyer agents
//         const buyerAgents = await BuyerAgent.find();

//         // Return the list of buyer agents
//         res.status(200).json({
//             code: 1,
//             message: 'Buyer agents retrieved successfully',
//             data: buyerAgents
//         });
//     } catch (error) {
//         res.status(500).json({
//             code: 0,
//             message: 'Server Error',
//             data: null
//         });
//     }
// });

app.get('/api/allBuyerAgents', async (req, res) => {
    try {
        // Find all buyer agents where the 'proposals' array has at least one entry
        const buyerAgents = await BuyerAgent.find({ proposals: { $exists: true, $not: { $size: 0 } } });

        // Return the filtered list of buyer agents
        res.status(200).json({
            code: 1,
            message: 'Buyer agents with proposals retrieved successfully',
            data: buyerAgents
        });
    } catch (error) {
        res.status(500).json({
            code: 0,
            message: 'Server Error',
            data: null
        });
    }
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
