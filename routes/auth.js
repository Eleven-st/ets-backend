// \ets-backend\routes\auth.js

import { verify_token } from "../utils/verify_token.js";
import express from "express";
import {
    initiate_signup,
    verify_signup,
    initiate_login,
    verify_login,
    get_user_profile,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/initiate-signup", initiate_signup);
router.post("/verify-signup", verify_signup);
router.post("/initiate-login", initiate_login);
router.post("/verify-login", verify_login);
router.get("/user", verify_token, get_user_profile);

export default router;
