import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";
import { uploadResidentCard } from "../middleware/uploadResidentCard.js";
import { uploadStaffPhoto } from "../middleware/uploadStaffPhoto.js";
import {
  listStaff,
  listTrashStaff,
  createStaff,
  getStaff,
  updateStaff,
  softDeleteStaff,
  restoreStaff,
  hardDeleteStaff,
  uploadPhoto,
} from "../controllers/staffController.js";
import { scanResidentCard } from "../controllers/staffResidentCardController.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole(["admin", "hr"]));

router.get("/", listStaff);
router.get("/trash", listTrashStaff);
router.post("/", createStaff);

/* =========================
   STAFF PHOTO
========================= */
router.post("/:id/photo", uploadStaffPhoto.single("photo"), uploadPhoto);

/* =========================
   RESIDENT CARD SCAN
   tetap dipertahankan sesuai flow lama
========================= */
router.post(
  "/:id/resident-card/scan",
  uploadResidentCard.single("image"),
  scanResidentCard
);

router.get("/:id", getStaff);
router.put("/:id", updateStaff);
router.delete("/:id", softDeleteStaff);

/* =========================
   RESTORE / PERMANENT DELETE
========================= */
router.post("/:id/restore", restoreStaff);
router.delete("/:id/permanent", hardDeleteStaff);

export default router;