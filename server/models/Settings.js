// server/models/Settings.js
import mongoose from "mongoose";

const SettingsSchema = new mongoose.Schema(
  {
    // contoh: "permitReminderDays"
    key: { type: String, required: true, unique: true, index: true },

    // isi bebas: number | string | object | array
    value: { type: mongoose.Schema.Types.Mixed, default: null },

    // optional metadata
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

// helper optional (biar rapi dipakai di controller/cron)
SettingsSchema.statics.getValue = async function (key, fallback = null) {
  const doc = await this.findOne({ key }).lean();
  return doc?.value ?? fallback;
};

SettingsSchema.statics.setValue = async function (key, value, description = "") {
  const doc = await this.findOneAndUpdate(
    { key },
    { $set: { value, ...(description ? { description } : {}) } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );
  return doc;
};

export default mongoose.model("Settings", SettingsSchema);