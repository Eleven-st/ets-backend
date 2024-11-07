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

        req.user_id = payload;
        next();
    } catch (err) {
        return next(create_request_error(403, "access token not valid"));
    }
};
