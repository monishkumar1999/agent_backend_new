 const express=require('express');
const { addAgent, loginAgent,loginwithGoogle,updateAgentDetails, verifyOtp, viewAgentDetails, viewRequest, update_request, viewProposalRequest } = require('../../controller/AgentController');
const verifyAgentJwt = require('../../utils/agent/verifyAgent');

const agentRouter = express.Router();


agentRouter.post("/register",addAgent)
agentRouter.post("/login",loginAgent)
agentRouter.post("/google-login",loginwithGoogle)
agentRouter.post("/verify-otp", verifyOtp);
agentRouter.put("/add-agent-details",verifyAgentJwt,updateAgentDetails);
agentRouter.get("/get-agent-details",verifyAgentJwt,viewAgentDetails)

agentRouter.get("/view/request",verifyAgentJwt,viewRequest)

agentRouter.post("/update/request",verifyAgentJwt,update_request)


agentRouter.post("/proposal/view",verifyAgentJwt,viewProposalRequest)


module.exports=agentRouter;