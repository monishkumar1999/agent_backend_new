const nodemailer = require("nodemailer");
require("dotenv").config(); // Load environment variables

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER, // Use environment variables
        pass: process.env.EMAIL_PASS, // Use environment variables
    },
});


const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

module.exports = { transporter, generateOtp };
