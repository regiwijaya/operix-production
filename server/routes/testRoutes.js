import express from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

// siapapun yang sudah login boleh
router.get("/protected", requireAuth, (req, res) => {
  res.json({ message: "✅ protected ok", user: req.user });
});

// hanya admin/hr
router.get("/hr-only", requireAuth, requireRole(["admin", "hr"]), (req, res) => {
  res.json({ message: "✅ HR/admin area", user: req.user });
});

export default router;
