import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },

    role: {
      type: String,
      enum: ["admin", "hr", "staff"],
      default: "staff",
      required: true
    },

    // relasi ke staff nanti (Tahap 2)
    staffId: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", default: null },

    // simpan refresh token aktif (sederhana untuk MVP)
    refreshTokenHash: { type: String, default: null },

    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

export default mongoose.model("User", UserSchema);
