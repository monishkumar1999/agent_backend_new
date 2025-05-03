const express = require("express");
const { login, register,verifyOtp,getAgentsByProposal,getAgentDetailsById} = require("../../controller/mainUserController");
const verifyUserJwt = require("../../middleware/verifyUserJwt");

usersRouter=express.Router();

usersRouter.post("/login",login)
usersRouter.post("/register",register)
usersRouter.post("/verify-otp", verifyOtp); 
usersRouter.get("/findagent", verifyUserJwt,getAgentsByProposal); 
usersRouter.get("/get-agent-details/:agentId", verifyUserJwt,getAgentDetailsById); 


module.exports=usersRouter;