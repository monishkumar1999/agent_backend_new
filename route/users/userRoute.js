const express = require("express");
const { addUser,loginUser, loginWithGoogle,updateUserProfile,upload,verifyOtp } = require("../../controller/userController");
const verifyUserJwt = require("../../middleware/verifyUserJwt");
const multer = require("multer");
const { addProposal, getAgentsByProposal, proposalRequestGiveToAgent ,getUserProposals, viewAgentDetails, createRequest, getRequests, getAllAgents} = require("../../controller/ProposalController");

const userRouter = express.Router();
userRouter.post("/add", addUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login",loginWithGoogle);
userRouter.put("/userProfile-update", verifyUserJwt, upload.single("profileImage"), updateUserProfile);
userRouter.post("/verify-otp", verifyOtp); 
userRouter.post("/store-proposal",verifyUserJwt,addProposal)
userRouter.get("/find-agent",verifyUserJwt,getAgentsByProposal)
userRouter.post("/give-request-to-agent",verifyUserJwt,proposalRequestGiveToAgent)

userRouter.post("/get-proposals",verifyUserJwt,getUserProposals)

userRouter.get("/view-agent/:agentId",verifyUserJwt,viewAgentDetails);

userRouter.post("/proposal-requests",verifyUserJwt,createRequest);

userRouter.post("/get-requests",verifyUserJwt,getRequests);

userRouter.post("/get-all-agents",getAllAgents);

module.exports = userRouter;
