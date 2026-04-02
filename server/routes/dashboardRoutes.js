import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { getPermitReminders } from "../controllers/dashboardController.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["admin", "hr"]));

router.get("/permit-reminders", getPermitReminders);

export default router;