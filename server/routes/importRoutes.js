import express from "express";
import multer from "multer";
import {
  previewStaffImport,
  commitStaffImport,
  getStaffImportHistory,
  rollbackStaffImport,
} from "../controllers/importController.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { requireRole } from "../middleware/requireRole.js";

const router = express.Router();

const upload = multer({
  dest: "uploads/excel/",
});

router.get(
  "/staff/history",
  requireAuth,
  requireRole(["admin", "hr"]),
  getStaffImportHistory
);

router.post(
  "/staff/preview",
  requireAuth,
  requireRole(["admin", "hr"]),
  upload.single("file"),
  previewStaffImport
);

router.post(
  "/staff/commit",
  requireAuth,
  requireRole(["admin", "hr"]),
  upload.single("file"),
  commitStaffImport
);

router.post(
  "/staff/batches/:batchId/rollback",
  requireAuth,
  requireRole(["admin", "hr"]),
  rollbackStaffImport
);

export default router;