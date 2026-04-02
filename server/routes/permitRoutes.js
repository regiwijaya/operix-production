import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

import {
  listPermits,
  createPermit,
  updatePermit,
  deletePermit,
} from "../controllers/permitController.js";

const router = Router();

// Semua endpoint permit harus login
router.use(requireAuth);

// Hanya admin/hr
router.use(requireRole(["admin", "hr"]));

router.get("/", listPermits);
router.post("/", createPermit);
router.put("/:id", updatePermit);
router.delete("/:id", deletePermit);

export default router;