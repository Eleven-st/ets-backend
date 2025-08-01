// ets-backend/utils/verify_token.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { create_request_error } from "./request_error.js";

dotenv.config();

export const verify_token = (req, res, next) => {
    try {
        let token = undefined;
        const authorizationHeader = req.headers.authorization;

        if (authorizationHeader?.startsWith("Bearer ")) {
            token = authorizationHeader.split(" ")[1];
        }

        if (!token) {
            return next(create_request_error(400, "you are not authenticated"));
        }

        const payload = jwt.verify(token, process.env.JWT_SECRET);

       // Assuming payload is now an object like { userId: "..." }
        req.user_id = payload.userId; // Extract the userId from the payload object
        next();
    } catch (err) {
        return next(create_request_error(403, "access token not valid"));
    }
};
