const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const multer = require("multer"); 

const usersModel = require("../model/users/usersModel");
const { jwt_secret_key } = require("../utils/constant");
const { generateOtp, transporter } = require("../utils/email/email");



  
const addUser = async (req, res) => {
    try {
        const { userName, email, mobile, password } = req.body;

        // Check if user exists with action "0"
        const existingUser = await usersModel.findOne({ $or: [{ email }, { mobile }] });

        if (existingUser) {
            return res.status(400).json({ message: "Email or mobile already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user (inactive)
        const newUser = new usersModel({
            userName,
            email,
            mobile,
            password: hashedPassword,
            action: "0", // Inactive until OTP verification
        });

        await sendOtp(req, res);
        
        await newUser.save();

        // Send OTP
        

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user where action is "1" (active users only)
        const user = await usersModel.findOne({ email, action: "0" });

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate OTP for login
        await sendOtp(req, res);

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


  const loginWithGoogle = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Check if the user exists
        const user = await usersModel.findOne({ email, action: "0" });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: "user" },
            jwt_secret_key,
            { expiresIn: "5d" }
        );

        // Set cookie with JWT token
        res.cookie("authToken", token, {
            httpOnly: true,
            secure: false, // Set to true in production
            sameSite: "Strict",
            maxAge: 3600000, // 1 hour expiration
        });

        return res.status(200).json({ message: "Google login successful", token });

    } catch (error) {
        console.error("Google Login Error:", error);
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


const updateUserProfile = async (req, res) => {
   
    try {
        const { userName, mobile } = req.body;
        const userId = req.user.id;

        console.log(userId)
        const updateFields = {};
        if (userName) updateFields.userName = userName;
        if (mobile) updateFields.mobile = mobile;
        if (req.file) updateFields.profileImage = `/uploads/users/${req.file.filename}`;

        const updatedUser = await UserModel.findByIdAndUpdate(userId, updateFields, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/users"); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });


const sendOtp = async (req, res) => {
    const { email } = req.body;
  
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
  
    try {
      const user = await usersModel.findOne({ email });
  
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
  
      const otpCode = generateOtp();
      const otpExpires = Date.now() + 20 * 60 * 1000; // 20 mins
  
      user.otp = otpCode;
      user.otpExpires = otpExpires;
  
      await user.save();
  
      await transporter.sendMail({
        from: "digitowls10@gmail.com",
        to: email,
        subject: "Your Verification Code",
        text: `Your OTP is: ${otpCode}`,
      });
  
      return res.status(200).json({ message: "OTP sent successfully", email });
  
    } catch (error) {
      console.error("OTP Error:", error);
      return res.status(500).json({ message: "Failed to send OTP", error: error.message });
    }
  };
  



const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: "Email and OTP are required" });
    }

    try {
        const user = await usersModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.otp !== otp || Date.now() > user.otpExpires) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        user.otp = null;
        user.otpExpires = null;
        await user.save();

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: "user" },
            jwt_secret_key,
            { expiresIn: "5d" }
        );

        res.cookie("authToken", token, {
           
            maxAge: 3600000 // 1 hour
        });

        return res.status(200).json({ message: "OTP verified. Account activated.", token });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};



module.exports = { addUser ,loginUser,loginWithGoogle,updateUserProfile,upload,verifyOtp};
