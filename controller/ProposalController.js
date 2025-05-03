const AgentModel = require("../model/agent/agentModel");
const ProposalRequestModel = require("../model/requestAgent");
const { UserProposalModel } = require("../model/users/UsersProposal");

const addProposal = async (req, res) => {
    try {
        const userId = req.user?.id; // Ensure userId exists
        if (!userId) {
            return res.status(401).json({ success: false, message: "Unauthorized access" });
        }

        console.log(req.body)
        const {
            propertyType,
            noOfBedRooms,
            price_range,
            pincode,
            property_buying_plain,
            purpose_purchase,
            
            location
        } = req.body;

        // Validate required fields
        if (!propertyType) return res.status(400).json({ success: false, message: "Property type is required." });
       
       
        if (!pincode || !Array.isArray(pincode) || pincode.length === 0) {
            return res.status(400).json({ success: false, message: "At least one pincode is required as an array." });
        }
        if (!property_buying_plain) return res.status(400).json({ success: false, message: "Property buying plan is required." });
        if (!purpose_purchase) return res.status(400).json({ success: false, message: "Purpose of purchase is required." });
       
        if (!location) return res.status(400).json({ success: false, message: "Location is required." });

        // Create a new proposal document
        const newProposal = new UserProposalModel({
            propertyType,
         
            price_range,
            pincode,
            property_buying_plain,
            purpose_purchase,
            userId,
            location
        });

        // Save to database
        await newProposal.save();

        return res.status(201).json({
            success: true,
            message: "Proposal added successfully",
            data: newProposal,
        });

    } catch (error) {
        console.error("Error adding proposal:", error);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};



const getAgentsByProposal = async (req, res) => {
    try {
        const { proposalId } = req.body;
        const proposal = await UserProposalModel.findById(proposalId);

        if (!proposal) {
            return res.status(404).json({ success: false, message: "Proposal not found" });
        }

      

     
        // Find matching agents
        const matchingAgents = await AgentModel.find({
            // "agentDetails.postCode_cover": { $in: pincodeNumbers }, 
            action: "0", 
            // isSubscription: "1"
        });

        // Get the list of agent IDs
        const agentIds = matchingAgents.map(agent => agent._id);

        // Find existing ProposalRequests for these agents and proposalId
        const proposalRequests = await ProposalRequestModel.find({
            proposalId: proposalId,
            agentId: { $in: agentIds }
        });

        // Create a mapping of agentId to accept_status
        const agentStatusMap = {};
        proposalRequests.forEach(request => {
            agentStatusMap[request.agentId.toString()] = request.accept_status;
        });

        // Append accept_status to each agent
        const agentsWithStatus = matchingAgents.map(agent => ({
            ...agent.toObject(),
            accept_status: agentStatusMap[agent._id.toString()] || "pending" // Default to "pending" if no request exists
        }));

        return res.status(200).json({
            success: true,
            message: "Matching agents found",
            agents: agentsWithStatus
        });

    } catch (error) {
        console.error("Error fetching agents:", error.message, error.stack);
        return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
};


const getAllAgents = async (req, res) => {
    try {
      // Fetch all active agents
      const allAgents = await AgentModel.find({
        action: "0", // Active agents
        // isSubscription: "1" // Uncomment if subscription check is needed
      });
  
      // Append accept_status as "pending" to each agent
      const agentsWithStatus = allAgents.map(agent => ({
        ...agent.toObject(),
        accept_status: "pending" // Default status since no proposal is involved
      }));
  
      return res.status(200).json({
        success: true,
        message: "All agents retrieved",
        agents: agentsWithStatus
      });
    } catch (error) {
      console.error("Error fetching agents:", error.message, error.stack);
      return res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
    }
  };


const proposalRequestGiveToAgent = async (req, res) => {
    try {
        const { proposalId, AgentId } = req.body;
        const userId = req.user._id.toString(); // Get user ID from authenticated request

        console.log(userId);

        // ✅ Check if required fields are present
        if (!proposalId || !AgentId) {
            return res.status(400).json({
                status: false,
                message: "Both 'proposalId' and 'AgentId' are required"
            });
        }

        // ✅ Find the proposal that belongs to this user
        const proposal = await UserProposalModel.findOne({ _id: proposalId, userId: userId });

        if (!proposal) {
            return res.status(404).json({
                status: false,
                message: "Proposal not found or doesn't belong to the user"
            });
        }

        // ✅ Check if the agent exists
        const agent = await AgentModel.findById(AgentId);
        if (!agent) {
            return res.status(404).json({
                status: false,
                message: "Agent not found"
            });
        }

        // ✅ Ensure `acceptAgent` is an array (if not, initialize it)
        if (!Array.isArray(proposal.acceptAgent)) {
            proposal.acceptAgent = [];
        }

        // ✅ Check if the agent is already assigned
        const isAlreadyAssigned = proposal.acceptAgent.some(a => a.agent_id.toString() === AgentId);
        if (isAlreadyAssigned) {
            return res.status(400).json({
                status: false,
                message: "Agent is already assigned to this proposal"
            });
        }

        // ✅ Check if the maximum limit (5 agents) is reached
        if (proposal.acceptAgent.length >= 5) {
            return res.status(400).json({
                status: false,
                message: "Maximum 5 agents can be assigned to a proposal"
            });
        }

        // ✅ Add new agent
        proposal.acceptAgent.push({ agent_id: AgentId });

        // ✅ Save changes
        await proposal.save();

        return res.status(200).json({
            status: true,
            message: "Agent assigned successfully",
            proposal
        });

    } catch (error) {
        console.error("Error in proposalRequestGiveToAgent:", error);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
            error: error.message
        });
    }
};


const getUserProposals = async (req,res) => {

    const userId=req.user._id.toString();

  
    try {
        const proposals = await UserProposalModel.find({ userId })
           

        if(!proposals){

            res.json({
                status:"false",
                message:"no data found"
            })
        }

        res.json({
            status:"false",
            data:proposals
        })
       
        return proposals;
    } catch (error) {
        console.error("Error fetching user proposals:", error);
        return null;
    }
};


const mongoose = require("mongoose"); // Ensure you import mongoose

const viewAgentDetails = async (req, res) => {
    try {
        const { agentId } = req.params;

        // Check if agentId is a valid MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(agentId)) {
            return res.status(400).json({
                status: "false",
                message: "Invalid Agent ID format",
            });
        }

        const agentDetails = await AgentModel.findOne({ _id: agentId });

        if (!agentDetails) {
            return res.json({
                status: "false",
                message: "No data found",
            });
        }

        res.json({
            status: "true",
            data: agentDetails,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            status: "false",
            message: "Server error",
            error: error.message,
        });
    }
};


const createRequest=async (req, res) => {
    try {
        const { proposalId, agentId } = req.body;

        const userId=req.user._id.toString();

    
        // Validate required fields
        if (!proposalId || !userId || !agentId) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Create a new proposal request
        const newProposalRequest = new ProposalRequestModel({
            proposalId,
            userId,
            agentId,
          
        });

        // Save to database
        await newProposalRequest.save();

        res.status(201).json({
            success: true,
            message: "Proposal request created successfully",
            proposalRequest: newProposalRequest
        });

    } catch (error) {
        console.error("Error creating proposal request:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}




const getRequests = async (req, res) => {
    try {
        const userId = req.user._id.toString();


        // Fetch requests where agentId matches
        const requests = await ProposalRequestModel.find({ userId })
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

module.exports = { addProposal, getAgentsByProposal, proposalRequestGiveToAgent,getUserProposals,viewAgentDetails,createRequest,getRequests,getAllAgents };
