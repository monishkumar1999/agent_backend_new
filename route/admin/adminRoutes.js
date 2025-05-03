const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('../../model/admin');
const cors = require('cors');
const { jwt_secret_key } = require('../../utils/constant');
const verifyAdminToken = require('../../middleware/verifyAdmin');
const { getAgent, approveAgent, agentDetails, user, userDetailsGet } = require('../../controller/adminController');

const router = express.Router();


// Login route with password hashing
router.post('/login', async (req, res) => {

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ status: 'false', message: 'Username and password are required' });
  }

  try {
    const admin = await Admin.findOne({ username });

    if (!admin) {
      return res.json({
        status: 'false',
        message: "Couldn't find the user",
      });
    }

   
    if (!password==admin.password) {
      return res.json({
        status: 'false',
        message: 'Wrong password',
      });
    }

    // Create JWT token with user info
    const token = jwt.sign(
  { userId: admin._id, username: admin.username, role: "admin" },
  jwt_secret_key,
  { expiresIn: '7d' }  // Set the JWT token to expire in 7 days
);

console.log(token)
// Set JWT token in cookie (with security flags)
res.cookie('authToken', token, {
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days expiration (in milliseconds)
  
});

    // Send the token in the response as well (if needed on frontend)
    res.status(200).json({
      status: 'true',
      message: 'Login successful',
      token: token,  // You might want to send the token in the body for client-side use
    });
  } catch (err) {
    res.status(500).json({
      status: 'false',
      message: 'Error during login',
      error: 'Internal server error',
    });
  }
});

  
router.post("/agent-view",verifyAdminToken,getAgent)


router.put('/agents-approve',verifyAdminToken,approveAgent);

router.post("/get-agent-details",verifyAdminToken,agentDetails);

router.get("/users-view",verifyAdminToken,user)

router.post("/user-name",verifyAdminToken,userDetailsGet)


router.get("/users-userSidemenu",verifyAdminToken,user)

module.exports = router;
