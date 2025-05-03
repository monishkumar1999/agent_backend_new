const mongoose = require('mongoose');

const agentsSchema = new mongoose.Schema({
    agent_id: {
        type: mongoose.Schema.ObjectId,
        ref: "agents",
        required: true
    }
});

const messageSchema = new mongoose.Schema({
    participate: [{ type: mongoose.Schema.Types.ObjectId }], // Added ref for users
    sender: { type: mongoose.Schema.Types.ObjectId }, // Added ref for users
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    seen: { type: Boolean, default: false }
});

const Proposal = new mongoose.Schema({
    propertyType: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'properties',
        required: true
    },
    noOfBedRooms: {
        type: Number,
     
    },
    pincode: {
        type: [String],
        required: true
    },
    property_buying_plain: {
        type: String,
        required: true
    },
    purpose_purchase: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "purchase_purpose",
        required: true
    },
    communicate_preferred: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "communicatePreferred",
        required: false
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    action: {
        type: String,
        enum: ['0', '1'],
        default: '0'
    },
    is_close: {
        type: String,
        enum: ['0', '1'],
        default: '0' // Fixed default value
    },
    location:{
        type:String,
        required:true
    },
    
    agents: {
        type: [agentsSchema], 
        default: []
    },
    chats: {
        type: [messageSchema],
        default: []
    },
   
}, { timestamps: true });


const UserProposalModel = mongoose.model("userProposal", Proposal);

module.exports = { UserProposalModel };
