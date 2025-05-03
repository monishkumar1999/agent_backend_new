const express = require("express");
const { OAuth2Client } = require("google-auth-library");

const router = express.Router();
const client = new OAuth2Client(process.env.CLIENT_ID);

router.post("/google", async (req, res) => {
    try {
        const { token } = req.body;

        // Verify token with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.CLIENT_ID,
        });

        const payload = ticket.getPayload(); // Extract user data
        console.log("✅ Verified Google User:", payload);

        // Now you can check if user exists in DB, create a session, etc.
        return res.json({ message: "User authenticated!", user: payload });
    } catch (error) {
        console.error("❌ Error verifying Google token:", error);
        return res.status(401).json({ message: "Unauthorized" });
    }
});

module.exports = router;
