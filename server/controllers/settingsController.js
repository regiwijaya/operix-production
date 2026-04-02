import AppSetting from "../models/AppSetting.js";

const KEY = "permitReminderDays";
const DEFAULT_DAYS = [30, 60, 90];

function normalizeDays(input) {
  const arr = Array.isArray(input) ? input : DEFAULT_DAYS;
  const clean = Array.from(
    new Set(
      arr
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n >= 1 && n <= 365)
    )
  ).sort((a, b) => a - b);

  return clean.length ? clean : DEFAULT_DAYS;
}

export async function getPermitReminderDays(req, res, next) {
  try {
    const doc = await AppSetting.findOne({ key: KEY });
    const days = normalizeDays(doc?.value?.days || doc?.value || DEFAULT_DAYS);
    res.json({ days });
  } catch (e) {
    next(e);
  }
}

export async function updatePermitReminderDays(req, res, next) {
  try {
    const days = normalizeDays(req.body?.days);

    const doc = await AppSetting.findOneAndUpdate(
      { key: KEY },
      { key: KEY, value: { days } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ days: normalizeDays(doc?.value?.days || doc?.value) });
  } catch (e) {
    next(e);
  }
}