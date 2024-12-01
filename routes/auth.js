import express from "express";
import {
    initiate_signup,
    verify_signup,
    initiate_login,
    verify_login,
} from "../controllers/auth.js";

const router = express.Router();

router.post("/initiate-signup", initiate_signup);
router.post("/verify-signup", verify_signup);
router.post("/initiate-login", initiate_login);
router.post("/verify-login", verify_login);

export default router;
