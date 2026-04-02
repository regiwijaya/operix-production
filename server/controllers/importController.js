import fs from "fs";
import Staff from "../models/Staff.js";
import ImportBatch from "../models/ImportBatch.js";
import {
  parseExcelFile,
  extractHeaders,
  suggestMapping,
  mapRowToStaff,
  validateMappedStaff,
} from "../services/excelImportService.js";

function safeUnlink(filePath) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {}
}

export async function previewStaffImport(req, res) {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "File wajib diunggah." });
    }

    const rows = parseExcelFile(file.path);
    const headers = extractHeaders(rows);
    const mapping = suggestMapping(headers);

    const previewRows = rows.slice(0, 10).map((row, index) => {
      const mapped = mapRowToStaff(row, mapping);
      const errors = validateMappedStaff(mapped, index + 2);
      return {
        rowNumber: index + 2,
        raw: row,
        mapped,
        errors,
      };
    });

    return res.json({
      message: "Preview berhasil dibuat.",
      fileName: file.originalname,
      totalRows: rows.length,
      headers,
      suggestedMapping: mapping,
      previewRows,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal membaca file import." });
  } finally {
    safeUnlink(file?.path);
  }
}

export async function commitStaffImport(req, res) {
  const file = req.file;

  try {
    if (!file) {
      return res.status(400).json({ message: "File wajib diunggah." });
    }

    const mapping = req.body.mapping ? JSON.parse(req.body.mapping) : {};
    const rows = parseExcelFile(file.path);

    if (!rows.length) {
      return res.status(400).json({ message: "File tidak memiliki data." });
    }

    const docs = [];
    const errors = [];

    rows.forEach((row, index) => {
      const mapped = mapRowToStaff(row, mapping);
      const rowErrors = validateMappedStaff(mapped, index + 2);

      if (rowErrors.length) {
        errors.push(...rowErrors);
      } else {
        docs.push(mapped);
      }
    });

    const batch = await ImportBatch.create({
      type: "staff",
      fileName: file.originalname,
      totalRows: rows.length,
      importedCount: 0,
      failedCount: errors.length,
      status: errors.length ? "failed_validation" : "previewed",
      mapping,
      errorsPreview: errors.slice(0, 100),
      createdBy: {
        id: req.user?.id || "",
        email: req.user?.email || "",
        role: req.user?.role || "",
      },
    });

    if (errors.length) {
      return res.status(400).json({
        message: "Masih ada error validasi. Import dibatalkan.",
        batchId: batch._id,
        totalRows: rows.length,
        validRows: docs.length,
        errorCount: errors.length,
        errors: errors.slice(0, 100),
      });
    }

    const docsWithBatch = docs.map((doc) => ({
      ...doc,
      importBatchId: batch._id,
    }));

    const inserted = await Staff.insertMany(docsWithBatch, { ordered: true });

    batch.importedCount = inserted.length;
    batch.failedCount = 0;
    batch.status = "imported";
    await batch.save();

    return res.json({
      message: "Import data karyawan berhasil.",
      batchId: batch._id,
      totalRows: rows.length,
      imported: inserted.length,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal mengimpor data karyawan." });
  } finally {
    safeUnlink(file?.path);
  }
}

export async function getStaffImportHistory(req, res) {
  try {
    const items = await ImportBatch.find({ type: "staff" })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    return res.json({ items });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal memuat riwayat import." });
  }
}

export async function rollbackStaffImport(req, res) {
  try {
    const { batchId } = req.params;

    const batch = await ImportBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({ message: "Batch import tidak ditemukan." });
    }

    if (batch.type !== "staff") {
      return res.status(400).json({ message: "Tipe batch tidak valid." });
    }

    if (batch.status === "rolled_back") {
      return res.status(400).json({ message: "Batch ini sudah pernah di-rollback." });
    }

    const deleted = await Staff.deleteMany({ importBatchId: batch._id });

    batch.status = "rolled_back";
    batch.rolledBackAt = new Date();
    batch.rolledBackBy = {
      id: req.user?.id || "",
      email: req.user?.email || "",
      role: req.user?.role || "",
    };
    await batch.save();

    return res.json({
      message: "Rollback batch berhasil.",
      batchId: batch._id,
      deletedCount: deleted.deletedCount || 0,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Gagal melakukan rollback batch." });
  }
}