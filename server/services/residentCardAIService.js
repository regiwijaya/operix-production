import fs from "fs";
import OpenAI from "openai";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY belum ditemukan. Pastikan ada di server/.env dan server direstart."
    );
  }

  return new OpenAI({ apiKey });
}

function cleanString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCardNumber(value) {
  const v = cleanString(value).replace(/\s+/g, "").toUpperCase();

  if (
    !v ||
    v === "NATIONALITY" ||
    v === "STATUS" ||
    v === "RESIDENCESTATUS" ||
    v === "CARDNUMBER"
  ) {
    return "";
  }

  return v;
}

function parseJapaneseOrIsoDate(value) {
  if (!value || typeof value !== "string") return null;
  const s = value.trim();

  let m = s.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo - 1, d)).toISOString();
  }

  m = s.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    return new Date(Date.UTC(y, mo - 1, d)).toISOString();
  }

  return null;
}

function normalizeResidenceStatus(value) {
  const v = cleanString(value);

  const junk = [
    "NATIONALITY",
    "CARD NUMBER",
    "CARDNUMBER",
    "PLACE OF ISSUE",
    "ISSUE DATE",
    "EXPIRY DATE",
  ];

  if (junk.includes(v.toUpperCase())) return "";
  return v;
}

function normalizePlaceOfIssue(value) {
  let v = cleanString(value);
  v = v.replace(/^\s*年\s*月\s*日\s*/g, "").trim();
  v = v.replace(/^\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日\s*/g, "").trim();
  return v;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function extractResidentCardInfoWithAI(imagePath) {
  const client = getOpenAIClient();

  const imageBase64 = fs.readFileSync(imagePath, { encoding: "base64" });

  const response = await client.responses.create({
    model: "gpt-5.4",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are an expert extractor for Japanese Residence Cards (在留カード). " +
              "Return ONLY valid JSON. No markdown. No explanation. " +
              "Extract these exact keys only: " +
              "cardNumber, residenceStatus, issueDate, expiryDate, placeOfIssue, confidence, rawNotes. " +
              "Rules: " +
              "1. cardNumber must be only the residence card number, never nationality or labels. " +
              "2. residenceStatus must be the status of residence / 在留資格 only. " +
              "3. issueDate must be the issue date / 交付年月日 if visible. " +
              "4. expiryDate must be the residence period end date / 在留期間(満了日) if visible. " +
              "5. placeOfIssue must be issuing office or authority only if visible. " +
              "6. If not confident, return empty string for text fields and null for date fields. " +
              "7. Dates must be returned as YYYY-MM-DD when possible. " +
              "8. confidence must be a number between 0 and 1. " +
              "9. rawNotes may briefly mention ambiguities.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Read this Japanese Residence Card image carefully and extract only the requested fields.",
          },
          {
            type: "input_image",
            image_url: `data:image/jpeg;base64,${imageBase64}`,
          },
        ],
      },
    ],
  });

  const raw = response.output_text?.trim() || "{}";
  const parsed = safeJsonParse(raw);

  if (!parsed) {
    throw new Error("AI response bukan JSON valid.");
  }

  return {
    cardNumber: normalizeCardNumber(parsed.cardNumber),
    residenceStatus: normalizeResidenceStatus(parsed.residenceStatus),
    issueDate: parsed.issueDate ? parseJapaneseOrIsoDate(parsed.issueDate) : null,
    expiryDate: parsed.expiryDate ? parseJapaneseOrIsoDate(parsed.expiryDate) : null,
    placeOfIssue: normalizePlaceOfIssue(parsed.placeOfIssue),
    confidence:
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : null,
    rawNotes: cleanString(parsed.rawNotes),
    rawJson: parsed,
  };
}