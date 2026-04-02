import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = path.join(__dirname, "..", "uploads", "staff-photos");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";

    const base = path
      .basename(file.originalname || "photo", ext)
      .replace(/[^a-zA-Z0-9-_]/g, "_")
      .slice(0, 50);

    const staffId = req.params?.id || "staff";
    cb(null, `${staffId}-${Date.now()}-${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Format file harus JPG, PNG, atau WEBP."), false);
  }

  cb(null, true);
}

export const uploadStaffPhoto = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});