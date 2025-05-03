const mongoose = require('mongoose');

// Define the schema for Role
const communicate_preferredSchema = new mongoose.Schema({
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
const preffredCommunicate = mongoose.model('communicatePreferred', communicate_preferredSchema);

module.exports = preffredCommunicate;
