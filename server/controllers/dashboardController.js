import Staff from "../models/Staff.js";

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function formatResidentCardItem(staff, today) {
  const end = new Date(staff.residentCard.expiryDate);
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  return {
    _id: staff._id,
    staffId: staff._id,
    staffName: staff.fullName || "-",
    staffEmail: staff.email || "",
    employeeNo: staff.employeeNo || "",
    residenceStatus: staff.residentCard?.residenceStatus || "",
    cardNumber: staff.residentCard?.cardNumber || "",
    issueDate: staff.residentCard?.issueDate || null,
    endDate: staff.residentCard?.expiryDate || null,
    placeOfIssue: staff.residentCard?.placeOfIssue || "",
    note: staff.residentCard?.note || "",
    daysLeft,
    employmentCategory: staff.employmentInfo?.category || "direct",
    sourceCompany: staff.employmentInfo?.sourceCompany || "",
    assignedCompany: staff.employmentInfo?.assignedCompany || "",
    workplaceCompany: staff.employmentInfo?.workplaceCompany || "",
    workplaceLocation: staff.employmentInfo?.workplaceLocation || "",
  };
}

export async function getPermitReminders(req, res, next) {
  try {
    const today = startOfDay();
    const date30 = addDays(today, 30);
    const date3m = addMonths(today, 3);
    const date4m = addMonths(today, 4);

    const staffs = await Staff.find({
      isActive: true,
      "residentCard.expiryDate": { $ne: null, $lte: date4m },
    })
      .sort({ "residentCard.expiryDate": 1 })
      .lean();

    const expired = [];
    const due30 = [];
    const due3m = [];
    const due4m = [];

    for (const s of staffs) {
      const end = startOfDay(s.residentCard.expiryDate);
      const item = formatResidentCardItem(s, today);

      if (end < today) {
        expired.push(item);
      } else if (end <= date30) {
        due30.push(item);
      } else if (end <= date3m) {
        due3m.push(item);
      } else if (end <= date4m) {
        due4m.push(item);
      }
    }

    const nearest = [...due30, ...due3m, ...due4m]
      .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
      .slice(0, 10);

    res.json({
      counts: {
        expired: expired.length,
        due30: due30.length,
        due3m: due3m.length,
        due4m: due4m.length,
      },
      expired,
      due30,
      due3m,
      due4m,
      nearest,
    });
  } catch (e) {
    next(e);
  }
}