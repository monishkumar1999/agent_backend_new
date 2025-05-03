const jwt = require("jsonwebtoken");
const { jwt_secret_key } = require("../utils/constant");
const usersModel = require("../model/users/usersModel");

const verifyUserJwt = async (req, res, next) => {
  try {
 
    // Get token from cookies or Authorization header
    const token = req.cookies?.authToken || req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    // Verify JWT synchronously before querying the DB
    const decoded = await jwt.verify(token, jwt_secret_key);
    
    if (decoded.role !== "user") {
      return res.status(403).json({ message: "Forbidden: Unauthorized role" });
    }

    // Fetch user from DB & ensure action = '0'
    const userDetails = await usersModel.findOne({ _id: decoded.userId, action: "0" });

    if (!userDetails) {
      return res.status(403).json({ message: "Forbidden: User is inactive or not found" });
    }

    req.user = userDetails; // Attach user data to request
    next(); // Move to the next middleware/controller

  } catch (error) {
    console.error("JWT Verification Error:", error);
    
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Forbidden: Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized: Token expired" });
    }
    
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = verifyUserJwt;
