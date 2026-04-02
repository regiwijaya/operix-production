import multer from "multer";
import fs from "fs";
import path from "path";

const uploadDir = path.join(process.cwd(), "uploads", "resident-cards");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase() || ".jpg";
    const base = path
      .basename(file.originalname || "resident-card", ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");

    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

function fileFilter(_req, file, cb) {
  const ok = ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype);

  if (!ok) {
    return cb(new Error("File harus berupa JPG, PNG, atau WEBP."));
  }

  cb(null, true);
}

export const uploadResidentCard = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
});