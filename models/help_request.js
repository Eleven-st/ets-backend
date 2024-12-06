import mongoose from "mongoose";

const help_schema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "user",
            required: true,
        },
        responder: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        responder_candidates: [
            { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        ],
        latitude: { type: String, required: true },
        longitude: { type: String, required: true },
        hospital_name: { type: String, required: true },
        issue: { type: String, required: true },
        urgency: { type: Number, required: true },
        tip: { type: Number },
        status: {
            type: String,
            enum: ["waiting", "rejected", "accepted", "completed"],
            default: "waiting",
        },
    },
    { timestamps: true }
);

const HelpRequest = mongoose.model("help_request", help_schema);

export default HelpRequest;
