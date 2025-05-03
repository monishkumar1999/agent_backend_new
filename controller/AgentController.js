
const AgentModel = require("../model/agent/agentModel");
const bcrypt = require("bcrypt");
const { jwt_secret_key } = require("../utils/constant");
const jwt = require("jsonwebtoken");
const { generateOtp, transporter } = require("../utils/email/email");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const ProposalRequestModel = require("../model/requestAgent");



const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/agent"); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, "profile-" + Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const fileTypes = /jpeg|jpg|png/; // Allow only images
        const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimeType = fileTypes.test(file.mimetype);

        if (mimeType && extName) {
            return cb(null, true);
        } else {
            return cb(new Error("Only images (jpeg, jpg, png) are allowed!"));
        }
    },
    limits: { fileSize: 2 * 1024 * 1024 }, // Limit file size to 2MB
});

const addAgent = async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password } = req.body;

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
            lastName,
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
            email: otpResult.email
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
      const sendResult = await sendOtp(agent.email); // pass agent.email from DB
  
      if (!sendResult.success) {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
  
      // ✅ Send success response
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


    const { email, phone, password } = req.body;

    const agent = await AgentModel.findOne({ email: email, action: '0' })

    console.log(agent)

    if (!agent) {
        return res.json({
            status: "false",
            message: "couldn't find the account"
        })
    }

    const token = jwt.sign(
        { userId: agent._id, email: agent.email, role: "agent" },
        jwt_secret_key,
        { expiresIn: "5d" }
    );

    res.cookie("authToken", token, {
        maxAge: 3600000,
    });

    res.status(200).json({
        staus: true,
        message: "Login successful"
    })
}





const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;


        const agent = await AgentModel.findOne({ email, action: "0" });



        if (!agent) {
            return res.status(400).json({ message: "Agent not found" });
        }



        // Check if OTP is valid
        if (agent.otpCode != otp) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Clear OTP after successful verification
        await AgentModel.findByIdAndUpdate(agent._id, { otp: null, otpExpires: null });

        // Generate JWT token
        const token = jwt.sign(
            { userId: agent._id, email: agent.email, role: "agent" },
            jwt_secret_key,
            { expiresIn: "5d" }
        );

        // Set cookie
        res.cookie("authToken", token, {

            maxAge: 3600000,
        });

        return res.status(200).json({ message: "Login successful", token });

    } catch (error) {
        console.error("OTP Verification Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const saveBase64Image = (base64String, folder = "uploads/agent") => {
    if (!base64String) return null;

    // Ensure the uploads folder exists
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }

    // Generate a unique filename
    const fileName = `profile-${Date.now()}.png`;
    const filePath = path.join(folder, fileName);

    // Remove metadata if present (data:image/png;base64,)
    const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");

    // Convert Base64 to Buffer and save to file
    fs.writeFileSync(filePath, base64Data, "base64");

    return `/uploads/agent/${fileName}`; // Return stored image path
};

const updateAgentDetails = async (req, res) => {
    try {
        const { profile_img, agentDetails, ...updateData } = req.body;
        const agentId = req.agent.userId;

        console.log(agentDetails)
        if (!agentId) {
            return res.status(400).json({ message: "Agent ID is required" });
        }

        // Validate and Save Image First
        let savedImagePath;
        if (profile_img) {
            savedImagePath = saveBase64Image(profile_img);
            if (!savedImagePath) {
                return res.status(400).json({ message: "Invalid image data" });
            }
        }

        // Construct the update payload
        let updatePayload = { $set: updateData };

        if (agentDetails) {
            Object.keys(agentDetails).forEach((key) => {
                updatePayload.$set[`agentDetails.${key}`] = agentDetails[key];
            });
        }

        // If an image was saved, update profile_img
        if (savedImagePath) {
            updatePayload.$set.profile_img = savedImagePath;
        }

        // Perform the update
        const updatedAgent = await AgentModel.findByIdAndUpdate(
            agentId,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!updatedAgent) {
            return res.status(404).json({ message: "Agent not found" });
        }

        return res.status(200).json({ message: "Agent details updated successfully", agent: updatedAgent });
    } catch (error) {
        console.error("Update Agent Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};






const viewAgentDetails = async (req, res) => {

    const agentId = req.agent.userId;


    const agentDetails = await AgentModel.findOne({
        _id: agentId
    })


    if (!agentDetails) {
        return res.json({
            status: "false",
            message: "No data found"
        })
    }


    res.json({
        status: "true",
        data: agentDetails
    })
}

const viewRequest = async (req, res) => {
    try {
        const agentId = req.agent.userId;


        // Fetch requests where agentId matches
        const requests = await ProposalRequestModel.find({ agentId })
            .populate("proposalId userId agentId") // Populate related data
            .sort({ createdAt: -1 }); // Sort by latest first

        if (!requests.length) {
            return res.status(404).json({ success: false, message: "No requests found for this agent" });
        }

        res.json({ success: true, data: requests });

    } catch (error) {
        console.error("Error fetching requests by agentId:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const update_request = async (req, res) => {
    try {


        const { accept_status, requestId, remark } = req.body;

        // Validate the status input
        if (!["pending", "accepted", "rejected"].includes(accept_status)) {
            return res.status(400).json({ success: false, message: "Invalid status value" });
        }

        // If rejecting, remark is required
        if (accept_status === "rejected" && (!remark || remark.trim() === "")) {
            return res.status(400).json({ success: false, message: "Remark is required when rejecting a request" });
        }

        // Prepare update object
        const updateData = { accept_status, updatedAt: Date.now() };
        if (accept_status === "rejected") {
            updateData.remark = remark;
        }

        // Find and update the proposal request
        const updatedRequest = await ProposalRequestModel.findByIdAndUpdate(
            requestId,
            updateData,
            { new: true } // Return the updated document
        );

        if (!updatedRequest) {
            return res.status(404).json({ success: false, message: "Proposal request not found" });
        }

        res.json({ success: true, message: "Status updated successfully", data: updatedRequest });

    } catch (error) {
        console.error("Error updating status:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};


const viewProposalRequest = async (req, res) => {
    try {
        const { proposalId } = req.body;


        // Fetch requests where agentId matches
        const requests = await ProposalRequestModel.find({ proposalId })
            .populate("proposalId userId agentId") // Populate related data
            .sort({ createdAt: -1 }); // Sort by latest first

        if (!requests.length) {
            return res.status(404).json({ success: false, message: "No requests found for this agent" });
        }

        res.json({ success: true, data: requests });

    } catch (error) {
        console.error("Error fetching requests by agentId:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

module.exports = { addAgent, loginAgent, loginwithGoogle, updateAgentDetails, verifyOtp, viewAgentDetails, viewRequest, update_request, viewProposalRequest };
