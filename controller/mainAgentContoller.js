const AgentModel = require("../model/agent/agentModel");
const bcrypt = require("bcrypt");
const { jwt_secret_key } = require("../utils/constant");
const jwt = require("jsonwebtoken");
const { generateOtp, transporter } = require("../utils/email/email");
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Unique filename
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4|mov|webm/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Invalid file type'));
  },
});

const addAgent = async (req, res) => {
  try {
    const { firstName, email, phone, password } = req.body;

    const existingAgent = await AgentModel.findOne({
      $or: [{ email }, { phone }],
      action: "0",
    });

    if (existingAgent) {
      return res.status(400).json({ message: "Email or phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5-minute expiry

    const newAgent = new AgentModel({
      firstName,
      email,
      phone,
      password: hashedPassword,
      action: "0",
      otpCode,
      otpExpires,
    });

    await newAgent.save();

    const otpResult = await sendOtp(email);
    if (!otpResult.success) {
      return res.status(500).json({ message: otpResult.message });
    }

    return res.status(201).json({
      message: "Agent created and OTP sent successfully",
      email: otpResult.email,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const loginAgent = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    // Find agent by email or phone
    const agent = await AgentModel.findOne({
      $or: [{ email }, { phone }],
      action: "0",
    });

    if (!agent) {
      return res.status(400).json({ message: "Invalid email/phone or password" });
    }

    const isMatch = await bcrypt.compare(password, agent.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email/phone or password" });
    }

    // Generate OTP and update agent
    const otpCode = generateOtp();
    const otpExpires = Date.now() + 20 * 60 * 1000; // 20 minutes

    await AgentModel.findByIdAndUpdate(agent._id, {
      otpCode,
      otpExpires,
    });

    // Send OTP to agent
    const sendResult = await sendOtp(agent.email);

    if (!sendResult.success) {
      return res.status(500).json({ message: "Failed to send OTP" });
    }

    return res.status(200).json({
      message: "OTP sent successfully",
      email: agent.email,
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const sendOtp = async (email) => {
  try {
    const agent = await AgentModel.findOne({ email });

    if (!agent || !agent.otpCode) {
      return { success: false, message: "No OTP found for user" };
    }

    await transporter.sendMail({
      from: "digitowls10@gmail.com",
      to: email,
      subject: "Your Verification Code",
      text: `Your OTP is: ${agent.otpCode}`,
    });

    return { success: true, message: "OTP sent successfully", email };
  } catch (error) {
    console.error("Send OTP Error:", error);
    return { success: false, message: "Failed to send OTP" };
  }
};

const loginwithGoogle = async (req, res) => {
  try {
    const { email } = req.body;

    const agent = await AgentModel.findOne({ email: email, action: '0' });

    if (!agent) {
      return res.status(404).json({
        status: "false",
        message: "Couldn't find the account",
      });
    }

    const token = jwt.sign(
      { userId: agent._id, email: agent.email, role: "agent" },
      jwt_secret_key,
      { expiresIn: "5d" }
    );

    res.cookie("authToken", token, {
      maxAge: 3600000, // 1 hour
    });

    res.status(200).json({
      status: true,
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const agent = await AgentModel.findOne({ email, action: "0" });

    if (!agent) {
      return res.status(400).json({ message: "Agent not found" });
    }

    // Check if OTP is valid
    if (agent.otpCode !== otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Clear OTP after successful verification
    await AgentModel.findByIdAndUpdate(agent._id, { otpCode: null, otpExpires: null });

    // Generate JWT token
    const token = jwt.sign(
      { userId: agent._id, email: agent.email, role: "agent" },
      jwt_secret_key,
      { expiresIn: "5d" }
    );

    // Set cookie
    res.cookie("authToken", token, {
      maxAge: 3600000, // 1 hour
    });

    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error("OTP Verification Error:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// GET agent details
const getAgentDetails = async (req, res) => {
  try {
    const agent = await AgentModel.findById(req.agent.userId);
   
    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    console.error("Get Agent Details Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// UPDATE agent profile
const updateProfile = async (req, res) => {
  try {
    const {
      firstName,
      email,
      phone,
      businessName,
      website,
      areasCovered,
      isLicensed,
      licenseNumber,
      licenseState,
      services,
      offMarketDeals,
      clientTypes,
      yearsOfExperience,
      clientsServed,
      avgBudget,
      bio,
      profileImage, // Expecting 'null' if removed
      additionalImages, // Expecting '[]', '', or 'unchanged'
      introVideo, // Expecting 'null' if removed
    } = req.body;

    const postCodeCover = areasCovered
      ? areasCovered.split(',').map(postcode => postcode.trim())
      : [];

    // Parse avgBudget into min/max
    const feesStructure = {
      min: avgBudget ? parseFloat(avgBudget) : 0,
      max: avgBudget ? parseFloat(avgBudget) + 1000 : 0,
    };

    // Map formData to agentDetails
    const agentDetails = {
      aboutAgent: bio || '',
      role: 'Agent',
      aboutAgency: businessName || '',
      NegotiationStyle: 'Standard',
      describes_agent: 'Professional',
      agency_name: businessName || '',
      Branch: 'Main',
      location_Address: 'Unknown',
      agencyType: 'Real Estate',
      services_provided: services ? (Array.isArray(services) ? services.join(', ') : services) : '',
      method_of_sale: offMarketDeals === 'true' ? 'Off-Market' : 'Public',
      buyer_agency_agreement: 'Standard',
      sales_team_count: 1,
      postCode_cover: postCodeCover,
      specialization: clientTypes ? (Array.isArray(clientTypes) ? clientTypes.join(', ') : clientTypes) : '',
      agent_work_type: 'Full-time',
      videoCall_offer: 'No',
      videoCallTech: 'Zoom',
      digital_solution: 'Online Portal',
      fees_structure: feesStructure,
      chargeType: 'Flat',
      fee: avgBudget || '0',
      website: website || '',
      isLicensed: isLicensed === 'true',
      licenseNumber: licenseNumber || '',
      licenseState: licenseState || '',
      yearsOfExperience: yearsOfExperience ? parseInt(yearsOfExperience) : 0,
      clientsServed: clientsServed ? parseInt(clientsServed) : 0,
    };

    // Fetch the existing agent data to get current file paths
    const existingAgent = await AgentModel.findById(req.agent.userId);
    if (!existingAgent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    // Handle file updates and removals
    const updateData = {
      firstName,
      email,
      phone,
      agentDetails,
    };

    // Handle profile image: update if new file is uploaded, remove if explicitly set to null
    if (req.files?.profileImage) {
      console.log("Uploading new profile image...");
      // If a new profile image is uploaded, delete the old one if it exists
      if (existingAgent.profile_img) {
        const oldProfileImagePath = path.join(__dirname, '..', '..', existingAgent.profile_img);
        try {
          await fs.unlink(oldProfileImagePath);
          console.log(`Deleted old profile image: ${oldProfileImagePath}`);
        } catch (err) {
          console.error(`Failed to delete old profile image: ${oldProfileImagePath}`, err);
        }
      }
      updateData.profile_img = `/uploads/${req.files.profileImage[0].filename}`;
    } else if (profileImage === 'null') {
      console.log("Removing profile image...");
      // If profile image is removed, delete the existing file
      if (existingAgent.profile_img) {
        const profileImagePath = path.join(__dirname, '..', '..', existingAgent.profile_img);
        try {
          await fs.unlink(profileImagePath);
          console.log(`Deleted profile image: ${profileImagePath}`);
        } catch (err) {
          console.error(`Failed to delete profile image: ${profileImagePath}`, err);
        }
      }
      updateData.profile_img = null; // Remove the profile image from the database
    }

    // Handle additional images: update if new files are uploaded, remove if explicitly set to empty, preserve if unchanged
    if (req.files?.additionalImages) {
      console.log("Uploading new additional images...");
      // If new additional images are uploaded, delete the old ones if they exist
      if (existingAgent.additionalImages && existingAgent.additionalImages.length > 0) {
        for (const oldImagePath of existingAgent.additionalImages) {
          const fullPath = path.join(__dirname, '..', '..', oldImagePath);
          try {
            await fs.unlink(fullPath);
            console.log(`Deleted old additional image: ${fullPath}`);
          } catch (err) {
            console.error(`Failed to delete old additional image: ${fullPath}`, err);
          }
        }
      }
      updateData.additionalImages = req.files.additionalImages.map(
        (file) => `/uploads/${file.filename}`
      );
    } else if (additionalImages === '[]' || additionalImages === '') {
      console.log("Removing additional images...");
      // If additional images are removed, delete the existing files
      if (existingAgent.additionalImages && existingAgent.additionalImages.length > 0) {
        for (const imagePath of existingAgent.additionalImages) {
          const fullPath = path.join(__dirname, '..', '..', imagePath);
          try {
            await fs.unlink(fullPath);
            console.log(`Deleted additional image: ${fullPath}`);
          } catch (err) {
            console.error(`Failed to delete additional image: ${fullPath}`, err);
          }
        }
      }
      updateData.additionalImages = []; // Remove all additional images from the database
    } else if (additionalImages === 'unchanged') {
      console.log("Preserving existing additional images...");
      // Preserve existing additional images
      updateData.additionalImages = existingAgent.additionalImages;
    }

    // Handle intro video: update if new file is uploaded, remove if explicitly set to null
    if (req.files?.introVideo) {
      console.log("Uploading new intro video...");
      // If a new intro video is uploaded, delete the old one if it exists
      if (existingAgent.introVideo) {
        const oldIntroVideoPath = path.join(__dirname, '..', '..', existingAgent.introVideo);
        try {
          await fs.unlink(oldIntroVideoPath);
          console.log(`Deleted old intro video: ${oldIntroVideoPath}`);
        } catch (err) {
          console.error(`Failed to delete old intro video: ${oldIntroVideoPath}`, err);
        }
      }
      updateData.introVideo = `/uploads/${req.files.introVideo[0].filename}`;
    } else if (introVideo === 'null') {
      console.log("Removing intro video...");
      // If intro video is removed, delete the existing file
      if (existingAgent.introVideo) {
        const introVideoPath = path.join(__dirname, '..', '..', existingAgent.introVideo);
        try {
          await fs.unlink(introVideoPath);
          console.log(`Deleted intro video: ${introVideoPath}`);
        } catch (err) {
          console.error(`Failed to delete intro video: ${introVideoPath}`, err);
        }
      }
      updateData.introVideo = null; // Remove the intro video from the database
    }

    // Update the agent in the database
    const agent = await AgentModel.findByIdAndUpdate(
      req.agent.userId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!agent) {
      return res.status(404).json({ success: false, message: 'Agent not found' });
    }

    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  addAgent,
  loginAgent,
  loginwithGoogle,
  verifyOtp,
  getAgentDetails,
  updateProfile,
  upload, // Export multer upload middleware for use in routes
};