const mongoose = require('mongoose');

// Define the schema correctly
const describeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true, // Ensures name is mandatory
        unique: true,   // Ensures name is unique
    },
    action: {
        type: String,
        enum: ['0', '1'], // Restricts the value of acion to '0' or '1'
        default: '0',  // Default value for acion
    },
}, {
    timestamps: true, // Adds createdAt and updatedAt fields
});

// Create the model
const Describe = mongoose.model('Describe', describeSchema);

module.exports = Describe;
