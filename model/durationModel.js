const mongoose = require('mongoose');

// Define the schema for Role
const durationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Ensures name is mandatory
        unique: true,   // Ensures name is unique
    },
    action: {
        type: String,
        enum: ['0', '1'], // Restricts the value of action to '0' or '1'
        default: '0',  // Default value for action
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Create the model for Role
const Durationagreement = mongoose.model('duration_buyer', durationSchema);

module.exports = Durationagreement;
