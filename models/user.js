import mongoose from "mongoose";

const user_schema = new mongoose.Schema(
    {
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        phone_no: { type: String, required: true, unique: true },
        gender: { type: String, enum: ["Male", "Female"], required: true },
        address: { type: String, required: true },
        dob: { type: String, required: true },
        blood_type: {
            type: String,
            enum: ["A+", "B+", "AB+", "O+", "A-", "B-", "AB-", "O-"],
            required: true,
        },
        emergency_contact: {
            type: {
                first_name: { type: String, required: true },
                last_name: { type: String, required: true },
                phone_no: { type: String, required: true },
                relation: {
                    type: String,
                    enum: ["Father", "Mother", "Gardian", "None"],
                    required: true,
                },
            },
            required: false,
        },
        vehicle_details: {
            type: {
                name: { type: String, required: true },
                number: { type: String, required: true },
                color: { type: String, required: true },
            },
            required: false,
        },
    },
    { timestamps: true }
);

const User = mongoose.model("user", user_schema);

export default User;
