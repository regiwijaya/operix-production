import fs from "fs";
import path from "path";
import Staff from "../models/Staff.js";

function toPositiveInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

function buildSearchQuery(q) {
  const keyword = String(q || "").trim();
  if (!keyword) return {};

  return {
    $or: [
      { fullName: { $regex: keyword, $options: "i" } },
      { kanaName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { employeeNo: { $regex: keyword, $options: "i" } },
      { department: { $regex: keyword, $options: "i" } },
      { position: { $regex: keyword, $options: "i" } },
    ],
  };
}

const activeFilter = {
  $or: [{ deleted: false }, { deleted: { $exists: false } }],
};

function safeDeleteLocalFile(urlPath = "") {
  try {
    if (!urlPath || !urlPath.startsWith("/uploads/")) return;
    const relativePath = urlPath.replace(/^\/+/, "");
    const absolutePath = path.join(process.cwd(), relativePath);

    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }
  } catch {}
}

export async function listStaff(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 100);
    const skip = (page - 1) * limit;

    const query = {
      ...activeFilter,
      ...buildSearchQuery(q),
    };

    const [items, total] = await Promise.all([
      Staff.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Staff.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function listTrashStaff(req, res, next) {
  try {
    const q = String(req.query.q || "").trim();
    const page = toPositiveInt(req.query.page, 1);
    const limit = Math.min(toPositiveInt(req.query.limit, 10), 100);
    const skip = (page - 1) * limit;

    const query = {
      deleted: true,
      ...buildSearchQuery(q),
    };

    const [items, total] = await Promise.all([
      Staff.find(query)
        .sort({ deletedAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Staff.countDocuments(query),
    ]);

    return res.json({ items, total, page, limit });
  } catch (e) {
    next(e);
  }
}

export async function createStaff(req, res, next) {
  try {
    const payload = {
      ...req.body,
      deleted: false,
      deletedAt: null,
      deletedBy: { id: "", email: "", role: "" },
      restoredAt: null,
      restoredBy: { id: "", email: "", role: "" },
    };

    const staff = await Staff.create(payload);
    return res.status(201).json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function getStaff(req, res, next) {
  try {
    const { id } = req.params;
    const staff = await Staff.findById(id).lean();

    if (!staff || staff.deleted === true) {
      return res.status(404).json({ message: "Staff tidak ditemukan." });
    }

    return res.json({
      staff,
      permits: [],
    });
  } catch (e) {
    next(e);
  }
}

export async function updateStaff(req, res, next) {
  try {
    const { id } = req.params;

    const staff = await Staff.findOneAndUpdate(
      { _id: id, ...activeFilter },
      req.body,
      { new: true, runValidators: true }
    );

    if (!staff) {
      return res.status(404).json({ message: "Staff tidak ditemukan." });
    }

    return res.json({ staff });
  } catch (e) {
    next(e);
  }
}

export async function uploadPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "File foto wajib diunggah." });
    }

    const staff = await Staff.findOne({ _id: id, ...activeFilter });

    if (!staff) {
      safeDeleteLocalFile(`/uploads/staff-photos/${file.filename}`);
      return res.status(404).json({ message: "Staff tidak ditemukan." });
    }

    if (staff.photoUrl) {
      safeDeleteLocalFile(staff.photoUrl);
    }

    staff.photoUrl = `/uploads/staff-photos/${file.filename}`;
    await staff.save();

    return res.json({
      message: "Foto staff berhasil diunggah.",
      photoUrl: staff.photoUrl,
      staff,
    });
  } catch (e) {
    if (req.file?.filename) {
      safeDeleteLocalFile(`/uploads/staff-photos/${req.file.filename}`);
    }
    next(e);
  }
}

export async function softDeleteStaff(req, res, next) {
  try {
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, ...activeFilter });
    if (!staff) {
      return res.status(404).json({ message: "Staff tidak ditemukan." });
    }

    staff.deleted = true;
    staff.deletedAt = new Date();
    staff.deletedBy = {
      id: req.user?.id || "",
      email: req.user?.email || "",
      role: req.user?.role || "",
    };

    await staff.save();

    return res.json({
      message: "Staff dipindahkan ke tempat sampah.",
      staff,
    });
  } catch (e) {
    next(e);
  }
}

export async function restoreStaff(req, res, next) {
  try {
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, deleted: true });
    if (!staff) {
      return res
        .status(404)
        .json({ message: "Staff tidak ditemukan di tempat sampah." });
    }

    staff.deleted = false;
    staff.deletedAt = null;
    staff.restoredAt = new Date();
    staff.restoredBy = {
      id: req.user?.id || "",
      email: req.user?.email || "",
      role: req.user?.role || "",
    };

    await staff.save();

    return res.json({
      message: "Staff berhasil dipulihkan.",
      staff,
    });
  } catch (e) {
    next(e);
  }
}

export async function hardDeleteStaff(req, res, next) {
  try {
    const { id } = req.params;

    const staff = await Staff.findOne({ _id: id, deleted: true });
    if (!staff) {
      return res
        .status(404)
        .json({ message: "Staff tidak ditemukan di tempat sampah." });
    }

    if (staff.photoUrl) {
      safeDeleteLocalFile(staff.photoUrl);
    }

    await Staff.deleteOne({ _id: id });

    return res.json({
      message: "Staff dihapus permanen.",
      deletedId: id,
    });
  } catch (e) {
    next(e);
  }
}