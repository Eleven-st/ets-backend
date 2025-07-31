import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const isMockMode = process.env.MOCK_TWILIO === "true";

const client = isMockMode
  ? null
  : twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

const pendingVerifications = {};
const mockOtpStore = {}; // Store mock OTPs in memory

// Helper to generate 6-digit mock OTP
const generateMockOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

export const initiate_signup = async (req, res, next) => {
  try {
    const {
      first_name,
      last_name,
      phone_no,
      gender,
      address,
      dob,
      blood_type,
    } = req.body;

    const existingUser = await User.findOne({ phone_no });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    pendingVerifications[phone_no] = {
      first_name,
      last_name,
      phone_no,
      gender,
      address,
      dob,
      blood_type,
    };

    if (isMockMode) {
      const otp = generateMockOTP();
      mockOtpStore[phone_no] = otp;
      console.log(`📦 [Mock OTP for signup]: ${otp} sent to +91${phone_no}`);
      return res
        .status(200)
        .json({ success: true, message: "Mock OTP sent for signup" });
    } else {
      await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verifications.create({
          to: `+91${phone_no}`,
          channel: "sms",
        });

      res
        .status(200)
        .json({ success: true, message: "OTP sent for signup" });
    }
  } catch (err) {
    next(err);
  }
};

export const verify_signup = async (req, res, next) => {
  try {
    const { phone_no, otp } = req.body;

    if (isMockMode) {
      if (mockOtpStore[phone_no] !== otp) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP" });
      }
      delete mockOtpStore[phone_no];
    } else {
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({
          to: `+91${phone_no}`,
          code: otp,
        });

      if (verification.status !== "approved") {
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP" });
      }
    }

    const userData = pendingVerifications[phone_no];
    if (!userData) {
      return res.status(400).json({
        success: false,
        message: "Signup data not found. Please try again.",
      });
    }

    const user = await User.create(userData);
    delete pendingVerifications[phone_no];

    const token = jwt.sign(user._id.toString(), process.env.JWT_SECRET);

    res.status(201).json({
      success: true,
      access_token: token,
      user_details: user,
    });
  } catch (err) {
    next(err);
  }
};

export const initiate_login = async (req, res, next) => {
  try {
    const { phone_no } = req.body;

    const user = await User.findOne({ phone_no });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (isMockMode) {
      const otp = generateMockOTP();
      mockOtpStore[phone_no] = otp;
      console.log(`📦 [Mock OTP for login]: ${otp} sent to +91${phone_no}`);
      return res
        .status(200)
        .json({ success: true, message: "Mock OTP sent for login" });
    } else {
      await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verifications.create({
          to: `+91${phone_no}`,
          channel: "sms",
        });

      res
        .status(200)
        .json({ success: true, message: "OTP sent for login" });
    }
  } catch (err) {
    next(err);
  }
};

export const verify_login = async (req, res, next) => {
  try {
    const { phone_no, otp } = req.body;

    if (isMockMode) {
      if (mockOtpStore[phone_no] !== otp) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP" });
      }
      delete mockOtpStore[phone_no];
    } else {
      const verification = await client.verify.v2
        .services(process.env.TWILIO_VERIFY_SID)
        .verificationChecks.create({
          to: `+91${phone_no}`,
          code: otp,
        });

      if (verification.status !== "approved") {
        return res
          .status(401)
          .json({ success: false, message: "Invalid OTP" });
      }
    }

    const user = await User.findOne({ phone_no });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const token = jwt.sign(user._id.toString(), process.env.JWT_SECRET);

    const public_user = {
      id: user._id.toString(),
      emergency_contact: user.emergency_contact,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_no: user.phone_no,
      gender: user.gender,
      address: user.address,
      dob: user.dob,
      blood_type: user.blood_type,
      vehicle_details: user.vehicle_details,
    };

    res.status(200).json({
      success: true,
      access_token: token,
      user_details: public_user,
    });
  } catch (err) { 
    next(err);
  }
};

// In ets-backend/controllers/auth.js

// ... (your existing auth controller functions) ...

export const get_user_profile = async (req, res, next) => {
    try {
        // req.user_id is set by the verify_token middleware if authentication is successful
        const userIdFromToken = req.user_id;

        // Fetch the user from the database
        const user = await User.findById(userIdFromToken);

        if (!user) {
            return res.status(404).json({ success: false, message: "User profile not found." });
        }

        // Return a public version of the user details, similar to verify_login
        const public_user = {
            id: user._id.toString(),
            emergency_contact: user.emergency_contact,
            first_name: user.first_name,
            last_name: user.last_name,
            phone_no: user.phone_no,
            gender: user.gender,
            address: user.address,
            dob: user.dob,
            blood_type: user.blood_type,
            vehicle_details: user.vehicle_details,
        };

        res.status(200).json({ success: true, user_details: public_user });

    } catch (err) {
        next(err); // Pass any errors to the Express error handling middleware
    }
};
