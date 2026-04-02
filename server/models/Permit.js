import mongoose from "mongoose";

const PermitSchema = new mongoose.Schema(
  {
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true, index: true },

    type: { type: String, default: "在留資格", trim: true },

    status: {
      type: String,
      enum: ["active", "expired", "pending"],
      default: "active",
      index: true,
    },

    startDate: { type: Date, default: null },
    endDate: { type: Date, required: true, index: true },

    note: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export default mongoose.model("Permit", PermitSchema);