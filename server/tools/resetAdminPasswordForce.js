import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@company.com";
  const newPassword = "admin123";

  const hash = await bcrypt.hash(newPassword, 10);

  const res = await User.updateOne(
    { email },
    { $set: { password: hash } }
  );

  console.log("✅ updateOne result:", res);
  console.log("✅ Password force-reset for:", email, "=>", newPassword);

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});