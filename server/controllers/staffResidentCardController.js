import fs from "fs";
import Staff from "../models/Staff.js";
import { extractResidentCardInfoWithAI } from "../services/residentCardAIService.js";

function mergeResidentCard(existing, parsed, imageUrl) {
  return {
    ...(existing || {}),
    imageUrl: imageUrl || existing?.imageUrl || "",

    cardNumber:
      parsed?.cardNumber ||
      existing?.cardNumber ||
      "",

    residenceStatus:
      parsed?.residenceStatus ||
      existing?.residenceStatus ||
      "",

    issueDate:
      parsed?.issueDate ||
      existing?.issueDate ||
      null,

    expiryDate:
      parsed?.expiryDate ||
      existing?.expiryDate ||
      null,

    placeOfIssue:
      parsed?.placeOfIssue ||
      existing?.placeOfIssue ||
      "",

    note: existing?.note || "",
  };
}

export async function scanResidentCard(req, res, next) {
  try {
    const { id } = req.params;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "File gambar Resident Card harus diupload.",
      });
    }

    const staff = await Staff.findById(id);

    if (!staff) {
      try {
        fs.unlinkSync(file.path);
      } catch {}
      return res.status(404).json({
        success: false,
        message: "Staff tidak ditemukan.",
      });
    }

    const parsed = await extractResidentCardInfoWithAI(file.path);
    const imageUrl = `/uploads/resident-cards/${file.filename}`;

    const currentResidentCard =
      typeof staff.residentCard?.toObject === "function"
        ? staff.residentCard.toObject()
        : staff.residentCard || {};

    staff.residentCard = mergeResidentCard(currentResidentCard, parsed, imageUrl);

    await staff.save();

    return res.status(200).json({
      success: true,
      message: "Resident Card berhasil discan dengan AI.",
      residentCard: staff.residentCard,
      parsedData: parsed,
      imageUrl,
    });
  } catch (error) {
    console.error("scanResidentCard error:", error);
    next(error);
  }
}