const express = require("express");
const Message = require("../model/Message");
const verifyAdminToken = require("../middleware/verifyAdmin");
const { default: mongoose } = require("mongoose");

const chatRouter = express.Router();

// ✅ Fetch messages using participate array
chatRouter.get("/get-message/:senderId/:receiverId", async (req, res) => {
    try {
        const { senderId, receiverId } = req.params;

        // Find messages where both users are in the participate array
        const messages = await Message.find({
            participate: { $all: [senderId, receiverId] } // Ensure both users exist in the array
        }).sort({ timestamp: 1 }).select("message sender timestamp seen"); 

        res.status(200).json({ success: true, messages });
    } catch (error) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
});


chatRouter.get("/recent-chats/:userId", verifyAdminToken, async (req, res) => {
    try {
      let { userId } = req.user;
      userId = new mongoose.Types.ObjectId(userId); // Ensure ObjectId
  
      const recentChats = await Message.aggregate([
        {
          $match: {
            participate: userId, // Match messages where userId is a participant
          },
        },
        {
          $sort: { timestamp: -1 }, // Sort by latest message first
        },
        {
          $group: {
            _id: {
              $cond: [
                { $lt: [{ $arrayElemAt: ["$participate", 0] }, { $arrayElemAt: ["$participate", 1] }] },
                { user1: { $arrayElemAt: ["$participate", 0] }, user2: { $arrayElemAt: ["$participate", 1] } },
                { user1: { $arrayElemAt: ["$participate", 1] }, user2: { $arrayElemAt: ["$participate", 0] } }
              ],
            },
            lastMessage: { $first: "$message" },
            lastMessageTime: { $first: "$timestamp" },
            sender: { $first: "$sender" },
          },
        },
        {
          $project: {
            _id: 0,
            lastMessage: 1,
            lastMessageTime: 1,
            receiverId: {
              $cond: [
                { $eq: ["$_id.user1", userId] },
                "$_id.user2",
                "$_id.user1",
              ],
            },
          },
        },
        {
          $lookup: {
            from: "users",
            localField: "receiverId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        { $unwind: "$receiver" },
        {
          $project: {
            receiverId: "$receiver._id",
            userName: "$receiver.userName",
            profileImage: "$receiver.profileImage",
            lastMessage: 1,
            lastMessageTime: 1,
          },
        },
        { $sort: { lastMessageTime: -1 } }, // Sort again by last message time
      ]);
  
      res.status(200).json({ chats: recentChats });
    } catch (error) {
      console.error("Error fetching recent chats:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });



  
  chatRouter.get("/recent-agentchats/:userId", verifyAdminToken, async (req, res) => {
    try {
      let { userId } = req.user;
      userId = new mongoose.Types.ObjectId(userId); // Ensure ObjectId
  
      // Aggregate to get recent chats with agents instead of users
      const recentChats = await Message.aggregate([
        {
          $match: {
            participate: userId, // Match messages where userId is a participant
          },
        },
        {
          $sort: { timestamp: -1 }, // Sort by latest message first
        },
        {
          $group: {
            _id: {
              $cond: [
                { $lt: [{ $arrayElemAt: ["$participate", 0] }, { $arrayElemAt: ["$participate", 1] }] },
                { agent1: { $arrayElemAt: ["$participate", 0] }, agent2: { $arrayElemAt: ["$participate", 1] } },
                { agent1: { $arrayElemAt: ["$participate", 1] }, agent2: { $arrayElemAt: ["$participate", 0] } }
              ],
            },
            lastMessage: { $first: "$message" },
            lastMessageTime: { $first: "$timestamp" },
            sender: { $first: "$sender" },
          },
        },
        {
          $project: {
            _id: 0,
            lastMessage: 1,
            lastMessageTime: 1,
            receiverId: {
              $cond: [
                { $eq: ["$_id.agent1", userId] },
                "$_id.agent2",
                "$_id.agent1",
              ],
            },
          },
        },
        {
          $lookup: {
            from: "agents", // Join with the agents collection
            localField: "receiverId",
            foreignField: "_id",
            as: "receiver",
          },
        },
        { $unwind: "$receiver" },
        {
          $project: {
            receiverId: "$receiver._id",
            firstName: "$receiver.firstName",
            lastName: "$receiver.lastName",
            profile_img: "$receiver.profile_img",
            lastMessage: 1,
            lastMessageTime: 1,
          },
        },
        { $sort: { lastMessageTime: -1 } }, // Sort again by last message time
      ]);
  
      res.status(200).json({ chats: recentChats });
    } catch (error) {
      console.error("Error fetching recent chats:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
});


module.exports = { chatRouter };
