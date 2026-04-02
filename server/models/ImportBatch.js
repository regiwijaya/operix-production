import mongoose from "mongoose";

const ImportBatchSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["staff"],
      required: true,
      default: "staff",
      index: true,
    },

    fileName: {
      type: String,
      trim: true,
      default: "",
    },

    totalRows: {
      type: Number,
      default: 0,
    },

    importedCount: {
      type: Number,
      default: 0,
    },

    failedCount: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["previewed", "imported", "failed_validation", "rolled_back"],
      default: "previewed",
      index: true,
    },

    mapping: {
      type: Object,
      default: {},
    },

    errorsPreview: {
      type: [
        {
          row: Number,
          field: String,
          message: String,
        },
      ],
      default: [],
    },

    createdBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },

    rolledBackBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },

    rolledBackAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ImportBatch", ImportBatchSchema);