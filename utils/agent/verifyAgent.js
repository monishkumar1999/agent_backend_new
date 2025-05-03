const jwt = require("jsonwebtoken");
const { jwt_secret_key } = require("../constant");

const verifyAgentJwt = (req, res, next) => {
    try {
        const token = req.cookies.authToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }

        jwt.verify(token, jwt_secret_key, (err, decoded) => {
            if (err) {
                return res.status(403).json({ message: "Forbidden: Invalid token" });
            }

           
            if (decoded.role !== "agent") {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }

            req.agent = decoded; 
            console.log("Verified Agent:", req.agent);
            next(); 
        });

    } catch (error) {
        console.error("JWT Verification Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

module.exports = verifyAgentJwt;
