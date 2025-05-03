const jwt = require("jsonwebtoken");
const { jwt_secret_key } = require("../utils/constant");

function checkJwt(req, res, next) {
    try {
       
        const token = req.cookies?.auth_token || req.cookies?.authToken;


        if (!token) {
            return res.status(401).json({ message: "No token provided" });
        }

        jwt.verify(token, jwt_secret_key
        );
        next();
    } catch (err) {
        return res.status(401).json({ message: "JWT expired" });
    }
}

module.exports = checkJwt;
