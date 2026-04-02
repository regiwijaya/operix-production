import express from "express";
import { seedAdmin, login, refresh, logout, me } from "../controllers/authController.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = express.Router();

router.post("/seed-admin", seedAdmin);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", requireAuth, me);

export default router;
