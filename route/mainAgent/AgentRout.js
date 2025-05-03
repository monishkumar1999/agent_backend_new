const express = require('express');
const {
  addAgent,
  loginAgent,
  loginwithGoogle,
  verifyOtp,
  getAgentDetails,
  updateProfile,
  upload,
} = require('../../controller/mainAgentContoller');
const verifyAgentJwt = require('../../utils/agent/verifyAgent');


const agentRouters = express.Router();

// Register a new agent
agentRouters.post("/register", addAgent);

// Login agent (sends OTP)
agentRouters.post("/login", loginAgent);

// Login with Google
agentRouters.post("/login/google", loginwithGoogle);

// Verify OTP and complete login
agentRouters.post("/verify-otp", verifyOtp);

// Get agent details (protected route)
agentRouters.get("/get-agent-details",verifyAgentJwt, getAgentDetails);

// Update agent profile (protected route with file uploads)
agentRouters.put(
  "/update-profile",verifyAgentJwt,
  upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'additionalImages', maxCount: 10 },
    { name: 'introVideo', maxCount: 1 },
  ]),
  updateProfile
);

module.exports = agentRouters;