const mongoose = require('mongoose');

const ProposalRequestSchema = new mongoose.Schema({
    proposalId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "userProposal", // Refers to the Proposal model
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users", // Refers to the User model
        required: true
    },
    agentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "agents", // Refers to the Agent model
        required: true
    },
    accept_status: {
        type: String,
        default: "pending"
    },
    remark: {
        type: String,
        default: ""
    }
}, { timestamps: true }); // Automatically creates createdAt and updatedAt fields

const ProposalRequestModel = mongoose.model("ProposalRequest", ProposalRequestSchema);

module.exports = ProposalRequestModel;
