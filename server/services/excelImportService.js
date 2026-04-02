import XLSX from "xlsx";

const FIELD_LABELS = {
  fullName: ["Nama", "Nama Lengkap", "Full Name", "fullName"],
  kanaName: ["Nama Katakana", "Nama Kana", "Kana Name", "kanaName"],
  email: ["Email", "email"],
  phone: ["Telepon", "Phone", "No Telepon", "phone"],
  employeeNo: ["No Karyawan", "Nomor Karyawan", "Employee No", "employeeNo"],
  department: ["Departemen", "Department", "department"],
  position: ["Jabatan", "Position", "position"],
  nationality: ["Kewarganegaraan", "Nationality", "nationality"],
  dateOfBirth: ["Tanggal Lahir", "Date of Birth", "dateOfBirth"],
  startDate: ["Tanggal Mulai Kerja", "Start Date", "startDate"],

  "address.postalCode": ["Kode Pos", "Postal Code"],
  "address.prefecture": ["Prefektur", "Prefecture"],
  "address.city": ["Kota", "City"],
  "address.detail": ["Detail Alamat", "Alamat Detail", "Address Detail"],

  "residentCard.cardNumber": [
    "Nomor Resident Card",
    "Resident Card",
    "Resident Card Number",
    "Card Number",
  ],
  "residentCard.residenceStatus": [
    "Status Izin Tinggal",
    "Residence Status",
  ],
  "residentCard.issueDate": [
    "Tanggal Terbit Resident Card",
    "Resident Card Issue Date",
    "Tanggal Terbit",
    "Issue Date",
  ],
  "residentCard.expiryDate": [
    "Tanggal Berakhir Resident Card",
    "Resident Card Expiry Date",
    "Tanggal Berakhir",
    "Expiry Date",
    "End Date",
  ],
  "residentCard.placeOfIssue": ["Tempat Penerbitan", "Place of Issue"],
  "residentCard.note": ["Catatan Resident Card", "Resident Card Note"],

  "employmentInfo.category": ["Kategori Penempatan", "Employment Category", "Category"],
  "employmentInfo.sourceCompany": ["Perusahaan Asal", "Source Company"],
  "employmentInfo.assignedCompany": ["Perusahaan Penempatan", "Assigned Company"],
  "employmentInfo.workplaceCompany": ["Perusahaan Tempat Kerja", "Workplace Company"],
  "employmentInfo.workplaceLocation": ["Lokasi Kerja", "Workplace Location"],
  "employmentInfo.note": ["Catatan Penempatan", "Employment Note"],

  "emergencyContacts.0.name": ["Kontak Darurat 1 Nama", "Emergency Contact 1 Name"],
  "emergencyContacts.0.relationship": ["Kontak Darurat 1 Hubungan", "Emergency Contact 1 Relationship"],
  "emergencyContacts.0.phone": ["Kontak Darurat 1 Telepon", "Emergency Contact 1 Phone"],

  "emergencyContacts.1.name": ["Kontak Darurat 2 Nama", "Emergency Contact 2 Name"],
  "emergencyContacts.1.relationship": ["Kontak Darurat 2 Hubungan", "Emergency Contact 2 Relationship"],
  "emergencyContacts.1.phone": ["Kontak Darurat 2 Telepon", "Emergency Contact 2 Phone"],

  notes: ["Catatan", "Notes"],
};

export const IMPORTABLE_FIELDS = Object.keys(FIELD_LABELS);

export function parseExcelFile(filePath) {
  const workbook = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows = XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
  });

  return rows;
}

export function extractHeaders(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  return Object.keys(rows[0]);
}

export function suggestMapping(headers = []) {
  const mapping = {};

  for (const field of IMPORTABLE_FIELDS) {
    const aliases = FIELD_LABELS[field] || [];
    const found = headers.find((h) =>
      aliases.some((alias) => normalizeHeader(alias) === normalizeHeader(h))
    );
    mapping[field] = found || "";
  }

  return mapping;
}

function normalizeHeader(value = "") {
  return String(value).trim().toLowerCase().replace(/\s+/g, "");
}

export function parseDateValue(value) {
  if (!value) return null;

  const s = String(value).trim();
  if (!s) return null;

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  return d;
}

export function setNestedValue(obj, path, value) {
  if (value === "" || value == null) return;

  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const isLast = i === keys.length - 1;
    const nextKey = keys[i + 1];
    const nextIsIndex = /^\d+$/.test(nextKey);

    if (isLast) {
      current[key] = value;
      return;
    }

    if (!(key in current)) {
      current[key] = nextIsIndex ? [] : {};
    }

    current = current[key];

    if (Array.isArray(current) && /^\d+$/.test(nextKey)) {
      const index = Number(nextKey);
      if (!current[index]) current[index] = {};
    }
  }
}

export function mapRowToStaff(row, mapping) {
  const doc = {
    address: {},
    residentCard: {},
    employmentInfo: {},
    emergencyContacts: [{}, {}],
  };

  for (const field of IMPORTABLE_FIELDS) {
    const header = mapping[field];
    if (!header) continue;

    let value = row[header];

    if (field === "dateOfBirth" || field === "startDate" ||
        field === "residentCard.issueDate" || field === "residentCard.expiryDate") {
      value = parseDateValue(value);
    } else if (field === "employmentInfo.category") {
      value = String(value || "").trim().toLowerCase();
      if (value === "langsung") value = "direct";
      if (value === "subkontrak") value = "subcontract";
    } else {
      value = String(value ?? "").trim();
    }

    setNestedValue(doc, field, value);
  }

  doc.emergencyContacts = (doc.emergencyContacts || []).filter(
    (x) => x?.name || x?.relationship || x?.phone
  );

  return doc;
}

export function validateMappedStaff(doc, rowIndex) {
  const errors = [];

  if (!doc.fullName) {
    errors.push({
      row: rowIndex,
      field: "fullName",
      message: "Nama lengkap wajib diisi.",
    });
  }

  if (
    doc.employmentInfo?.category &&
    !["direct", "subcontract"].includes(doc.employmentInfo.category)
  ) {
    errors.push({
      row: rowIndex,
      field: "employmentInfo.category",
      message: "Kategori penempatan harus direct atau subcontract.",
    });
  }

  if (doc.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doc.email)) {
    errors.push({
      row: rowIndex,
      field: "email",
      message: "Format email tidak valid.",
    });
  }

  return errors;
}