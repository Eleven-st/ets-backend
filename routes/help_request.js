import { Router } from "express";
import {
    get_active_help_request,
    get_help_history,
    get_pending_help_requests,
} from "../controllers/help_request.js";
import { verify_token } from "../utils/verify_token.js";

const router = Router();

router.get("/", verify_token, get_active_help_request);
router.get("/history", verify_token, get_help_history);
router.get("/pending", verify_token, get_pending_help_requests);

export default router;
