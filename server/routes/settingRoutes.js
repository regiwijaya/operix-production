import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  getPermitReminderDays,
  updatePermitReminderDays,
} from "../controllers/settingsController.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["admin", "hr"]));

router.get("/permit-reminder-days", getPermitReminderDays);
router.put("/permit-reminder-days", updatePermitReminderDays);

export default router;