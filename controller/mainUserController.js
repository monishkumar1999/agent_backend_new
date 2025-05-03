const usersModel = require("../model/users/usersModel")
const bcrypt = require('bcrypt');
const { generateOtp, transporter } = require("../utils/email/email");
const jwt = require("jsonwebtoken");
const { jwt_secret_key } = require("../utils/constant");
const AgentModel = require("../model/agent/agentModel");
const login = async (req, res) => {
    try {
        const { userDetails } = req.body;

        if (!userDetails || !userDetails.email || !userDetails.password) {
            return res.status(400).json({
                status: false,
                message: "Email and password are required"
            });
        }

        const userData = await usersModel.findOne({ email: userDetails.email });

        if (!userData) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(userDetails.password, userData.password);
        if (!isMatch) {
            return res.status(401).json({
                status: false,
                message: "Incorrect password"
            });
        }

        // Generate and store OTP
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        await usersModel.updateOne(
            { _id: userData._id },
            {
                $set: {
                    otp: otp,
                    otpExpires: otpExpires
                }
            }
        );

        // Send OTP
        const otpResult = await sendOtp(userData.email, otp);
        if (!otpResult.success) {
            return res.status(500).json({
                status: false,
                message: "Failed to send OTP"
            });
        }

        return res.status(200).json({
            status: true,
            message: "OTP sent to email. Please verify to complete login",
            user: {
                id: userData._id,
                email: userData.email,
                name: userData.userName,
                phone: userData.mobile
            }
        });

    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({
            status: false,
            message: "Server error"
        });
    }
};

const register = async (req, res) => {
    try {
        const { userDetails } = req.body;

        if (!userDetails || !userDetails.name || !userDetails.email || !userDetails.phone || !userDetails.password) {
            return res.status(400).json({
                status: false,
                message: 'All fields are required',
            });
        }

        const existingUser = await usersModel.findOne({
            $or: [
                { email: userDetails.email },
                { mobile: userDetails.phone }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                status: false,
                message: 'Email or phone already registered',
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userDetails.password, saltRounds);

        // Generate OTP
        const otp = generateOtp();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

        // Create new user
        const newUser = new usersModel({
            userName: userDetails.name,
            email: userDetails.email,
            mobile: userDetails.phone,
            password: hashedPassword,
            otp: otp,
            otpExpires: otpExpires
        });

        // Save user
        await newUser.save();

        // Send OTP
        const otpResult = await sendOtp(userDetails.email, otp);
        if (!otpResult.success) {
            return res.status(500).json({
                status: false,
                message: "Failed to send OTP"
            });
        }

        res.status(201).json({
            status: true,
            message: 'User registered successfully. Please verify OTP sent to email',
            user: {
                id: newUser._id,
                email: newUser.email,
                name: newUser.userName,
                phone: newUser.mobile
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            status: false,
            message: 'Server error',
        });
    }
};

const sendOtp = async (email, otp) => {
    try {
        await transporter.sendMail({
            from: "digitowls10@gmail.com",
            to: email,
            subject: "Your Verification Code",
            text: `Your OTP is: ${otp}. It will expire in 10 minutes.`,
        });

        return { success: true, message: "OTP sent successfully", email };
    } catch (error) {
        console.error("Send OTP Error:", error);
        return { success: false, message: "Failed to send OTP" };
    }
};

const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;


    if (!email || !otp) {

        return res.status(200).json({ message: "Email and OTP are required" });
    }

    try {
        const user = await usersModel.findOne({ email });


        if (!user) {
            return res.status(200).json({ message: "User not found" });
        }

        // if (user.otp !== otp || Date.now() > user.otpExpires) {
        //     console.log(user)
        //     return res.status(200).json({ message: "Invalid or expired OTP" });
        // }

        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: "user" },
            jwt_secret_key,
            { expiresIn: "5d" }
        );

        res.cookie("authToken", token, {

            maxAge: 3600000 // 1 hour
        });

        return res.status(200).json({ message: "OTP verified. Account activated.", token });

    } catch (error) {
        return res.status(200).json({ message: "Internal server error", error: error.message });
    }
};

const getAgentsByProposal = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
  
      // Extract filter parameters from query
      const { location, propertyType } = req.query;
  
      // Build the query object
      const query = { action: "0" };

      const matchingAgents = await AgentModel.find(query)
        .skip(skip)
        .limit(limit);
  
      const totalAgents = await AgentModel.countDocuments(query);
  
      const agentStatusMap = {};
  
      const agentsWithStatus = matchingAgents.map(agent => ({
        ...agent.toObject(),
        accept_status: agentStatusMap[agent._id.toString()] || "pending",
      }));
  
      return res.status(200).json({
        success: true,
        message: "Matching agents found",
        agents: agentsWithStatus,
        totalPages: Math.ceil(totalAgents / limit),
        currentPage: page,
        totalAgents,
      });
    } catch (error) {
      console.error("Error fetching agents:", error.message, error.stack);
      return res.status(500).json({
        success: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  };

  const getAgentDetailsById = async (req, res) => {
    try {
      const { agentId } = req.params;
      const agent = await AgentModel.findById(agentId);
  
      if (!agent) {
        return res.status(404).json({ success: false, message: 'Agent not found' });
      }
  
      res.status(200).json({ success: true, data: agent });
    } catch (error) {
      console.error("Get Agent Details By ID Error:", error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  };
  
module.exports = { login, register, verifyOtp, getAgentsByProposal,getAgentDetailsById}