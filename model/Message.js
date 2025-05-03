const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  participate: [{ type: mongoose.Schema.Types.ObjectId }], // Corrected array syntax
  sender: { type: mongoose.Schema.Types.ObjectId},
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  seen: { type: Boolean, default: false },
});

// Create and export the model
const Message = mongoose.model("messages", messageSchema);

module.exports = Message;
