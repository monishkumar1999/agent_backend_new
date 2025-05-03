require("dotenv").config();
const session = require("express-session");

const express = require('express');  // ✅ Add Express
const cors = require('cors');
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const app = express();  // ✅ Define `app` before using it

const corsOptions = {
    origin: 'http://localhost:3000',  // Correct origin (React app's URL)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Encrypted-Data'],
    credentials: true,  // Allow cookies and credentials to be sent
};

app.use(cors(corsOptions)); // ✅ Now `app` is defined before use

console.log("🚀 Google OAuth Strategy is being initialized...");

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.CLIENT_ID,
            clientSecret: process.env.CLIENT_SECRET,
            callbackURL: "http://localhost:8000/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                console.log("✅ Full Google Profile:", profile);  // Log entire profile

                // Extract user email
                const email = profile.emails?.[0]?.value;
                console.log("📧 User Email:", email);  // ✅ Log the email

                return done(null, profile); // Save user to DB if needed
            } catch (error) {
                console.error("❌ Error in Google OAuth:", error);
                return done(error, null);
            }
        }
    )
);

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

module.exports = passport;  // ✅ Export passport
