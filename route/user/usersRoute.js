const express = require("express");
const { login, register,verifyOtp,getAgentsByProposal} = require("../../controller/mainUserController");
const verifyUserJwt = require("../../middleware/verifyUserJwt");

usersRouter=express.Router();

usersRouter.post("/login",login)
usersRouter.post("/register",register)
usersRouter.post("/verify-otp", verifyOtp); 
usersRouter.get("/findagent", verifyUserJwt,getAgentsByProposal); 


module.exports=usersRouter;