import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@company.com";
  const password = "admin123";
  const role = "admin";

  const existing = await User.findOne({ email });
  if (existing) {
    console.log("Admin already exists:", existing.email);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);

  const u = await User.create({
    email,
    password: hash,
    role
  });

  console.log("✅ Admin created:", u.email);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});