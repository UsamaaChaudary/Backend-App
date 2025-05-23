require('dotenv').config();
const User = require('../models/User')
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");


const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();  
};



const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});




const sendPasswordResetCode = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });
    const resetCode = generateVerificationCode();
        console.log(`Generated Reset Code for ${email}: ${resetCode}`);

        user.resetPasswordCode = resetCode; 
        user.resetPasswordExpires = Date.now() + 3600000; 
        await user.save();
        console.log("After Saving User:", user);
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: "Password Reset Code",
            text: `Your password reset verification code is: ${resetCode}\nThis code will expire in 1 hour.`,
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: "Reset code sent to your email" });
    } catch (error) {
        console.error("Error sending reset code:", error);
        res.status(500).json({ message: "Server error" });
    }
};


const resetPasswordWithCode = async (req, res) => {
    const { email, code, newPassword, confirmPassword } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: "User not found" });

        console.log(`Received Code: ${code}`);
        console.log(`Stored Code: ${user.resetPasswordCode}`); 
        console.log(`Expiration Time: ${user.resetPasswordExpires}`);

        if (!user.resetPasswordCode || user.resetPasswordCode !== code || Date.now() > user.resetPasswordExpires) {
            return res.status(400).json({ message: "Invalid or expired reset code" });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.resetPasswordCode = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: "Password updated successfully" });
    } catch (error) {
        console.error("Error resetting password:", error);
        res.status(500).json({ message: "Server error" });
    }
};






module.exports = {  resetPasswordWithCode, sendPasswordResetCode  };



