import mongoose from "mongoose";

const EmergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, default: "" },
    relationship: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const ResidentCardSchema = new mongoose.Schema(
  {
    cardNumber: { type: String, trim: true, default: "" },
    residenceStatus: { type: String, trim: true, default: "" },
    issueDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null },
    placeOfIssue: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
    imageUrl: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const EmploymentInfoSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["direct", "subcontract"],
      default: "direct",
    },
    sourceCompany: { type: String, trim: true, default: "" },
    assignedCompany: { type: String, trim: true, default: "" },
    workplaceCompany: { type: String, trim: true, default: "" },
    workplaceLocation: { type: String, trim: true, default: "" },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const AddressSchema = new mongoose.Schema(
  {
    postalCode: { type: String, trim: true, default: "" },
    prefecture: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    detail: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const StaffSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    kanaName: { type: String, trim: true, default: "" },
    email: { type: String, trim: true, default: "" },
    phone: { type: String, trim: true, default: "" },

    photoUrl: { type: String, trim: true, default: "" },

    employeeNo: { type: String, trim: true, default: "" },
    department: { type: String, trim: true, default: "" },
    position: { type: String, trim: true, default: "" },
    nationality: { type: String, trim: true, default: "" },

    dateOfBirth: { type: Date, default: null },
    startDate: { type: Date, default: null },

    address: {
      type: AddressSchema,
      default: () => ({}),
    },

    residentCard: {
      type: ResidentCardSchema,
      default: () => ({}),
    },

    employmentInfo: {
      type: EmploymentInfoSchema,
      default: () => ({}),
    },

    emergencyContacts: {
      type: [EmergencyContactSchema],
      default: () => [],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length <= 2,
        message: "Emergency contacts maksimal 2.",
      },
    },

    notes: { type: String, trim: true, default: "" },

    importBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ImportBatch",
      default: null,
      index: true,
    },

    isActive: { type: Boolean, default: true },

    deleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
    restoredAt: {
      type: Date,
      default: null,
    },
    restoredBy: {
      id: { type: String, default: "" },
      email: { type: String, default: "" },
      role: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

StaffSchema.index({
  fullName: "text",
  kanaName: "text",
  email: "text",
  employeeNo: "text",
  department: "text",
  position: "text",
  "employmentInfo.sourceCompany": "text",
  "employmentInfo.assignedCompany": "text",
  "employmentInfo.workplaceCompany": "text",
});

export default mongoose.model("Staff", StaffSchema);