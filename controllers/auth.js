import User from "../models/user.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
const pendingVerifications = {};

dotenv.config();

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

        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({
                to: `+91${phone_no}`,
                channel: "sms",
            });

        res.status(200).json({ success: true, message: "OTP sent for signup" });
    } catch (err) {
        next(err);
    }
};

export const verify_signup = async (req, res, next) => {
    try {
        const { phone_no, otp } = req.body;
        console.log(phone_no, otp);

        const verification = await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verificationChecks.create({
                to: `+91${phone_no}`,
                code: otp,
            });

        console.log(verification);

        if (verification.status !== "approved") {
            return res
                .status(401)
                .json({ success: false, message: "Invalid OTP" });
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

        await client.verify.v2
            .services(process.env.TWILIO_VERIFY_SID)
            .verifications.create({
                to: `+91${phone_no}`,
                channel: "sms",
            });

        console.log("sent otp for login");

        res.status(200).json({ success: true, message: "OTP sent for login" });
    } catch (err) {
        next(err);
    }
};

export const verify_login = async (req, res, next) => {
    try {
        const { phone_no, otp } = req.body;

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
