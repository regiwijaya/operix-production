import cron from "node-cron";
import Settings from "../models/Settings.js";
import Permit from "../models/Permit.js";

let task = null;

const KEY = "permitReminderDays";
const DEFAULT_DAYS = [30, 60, 90];

let cache = {
  updatedAt: null,
  days: DEFAULT_DAYS,
  counts: { expired: 0, buckets: { "30": 0, "60": 0, "90": 0 } },
  nearest: [],
};

function daysUntil(date) {
  const end = new Date(date).getTime();
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

async function getDays() {
  let doc = await Settings.findOne({ key: KEY });
  if (!doc) doc = await Settings.create({ key: KEY, value: DEFAULT_DAYS });

  const days = Array.isArray(doc.value) ? doc.value.map((n) => Number(n)).filter(Boolean) : DEFAULT_DAYS;
  return [...days].sort((a, b) => a - b);
}

async function compute() {
  const days = await getDays();

  const permits = await Permit.find({ endDate: { $ne: null } })
    .populate("staffId", "fullName email employeeNo")
    .sort({ endDate: 1 });

  const counts = { expired: 0, buckets: {} };
  for (const d of days) counts.buckets[String(d)] = 0;

  const nearest = [];

  for (const p of permits) {
    const left = daysUntil(p.endDate);

    if (left < 0) {
      counts.expired++;
      continue;
    }

    const bucket = days.find((d) => left <= d);
    if (bucket) {
      counts.buckets[String(bucket)]++;
      if (nearest.length < 10) {
        nearest.push({
          _id: p._id,
          staff: {
            id: p.staffId?._id,
            fullName: p.staffId?.fullName,
            email: p.staffId?.email,
            employeeNo: p.staffId?.employeeNo,
          },
          type: p.type || p.visaCategory || "-",
          status: p.status || "-",
          startDate: p.startDate,
          endDate: p.endDate,
          daysLeft: left,
        });
      }
    }
  }

  cache = {
    updatedAt: new Date().toISOString(),
    days,
    counts,
    nearest,
  };

  return cache;
}

export function getPermitReminderCache() {
  return cache;
}

export function startPermitCron() {
  if (task) return;

  // run once on start
  compute().catch((e) => console.error("[permitCron] init error:", e));

  // run every 10 minutes
  task = cron.schedule("*/10 * * * *", async () => {
    try {
      await compute();
      console.log("[permitCron] refreshed:", cache.updatedAt);
    } catch (e) {
      console.error("[permitCron] run error:", e);
    }
  });

  console.log("[permitCron] started");
}

export function stopPermitCron() {
  if (!task) return;
  task.stop();
  task = null;
  console.log("[permitCron] stopped");
}