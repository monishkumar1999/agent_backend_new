const jwt = require('jsonwebtoken');
const { jwt_secret_key } = require('../utils/constant');

const verifyAdminToken = (req, res, next) => {
  const token = req.cookies?.auth_token || req.cookies?.authToken;

  console.log(req.cookies)

  if (!token) {
    return res.status(401).json({ status: 'false', message: 'Access denied. No token provided.' });
  }

  try {
  
    const decoded = jwt.verify(token, jwt_secret_key);
    req.user = decoded; 

    if (req.user.role !== 'admin') {
      return res.status(403).json({ status: 'false', message: 'Access denied. Admins only.' });
    }

  
    next(); 
  } catch (error) {
    return res.status(403).json({ status: 'false', message: 'Invalid token' });
  }
};

module.exports = verifyAdminToken;
