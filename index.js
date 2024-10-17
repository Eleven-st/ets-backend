import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { socketHandelr } from "./utils/socket_handelr.js";
import authRouter from "./routes/auth.js";
import helpRequestRouter from "./routes/help_request.js";

const app = express();
const server = http.createServer(app);

dotenv.config();

socketHandelr(server);

app.use(express.json());
app.use(cors());

app.use((err, req, res, next) => {
    const errStatus = err.status || 500;
    const errMessage = err.message || "something went worng!";
    return res.status(errStatus).json({
        sucess: false,
        status: errStatus,
        message: errMessage,
        stack: err.stack,
    });
});

app.use(cors());
app.use("/auth", authRouter);
app.use("/help-request", helpRequestRouter);

app.get("/healthcheck", (req, res) => {
    res.status(200).json({ sucess: true, message: "server is running" });
});

const port = process.env.PORT || 8000;
server.listen(port, () => {
    connect();
    console.log(`server running on port : ${port}`);
});

const connect = async () => {
    try {
        mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB database");
    } catch (err) {
        throw err;
    }
};
