import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);

  const email = "admin@company.com";

  console.log("DB:", mongoose.connection.name);

  const u1 = await User.findOne({ email });
  console.log("User found:", !!u1);
  console.log("Fields:", u1 ? Object.keys(u1.toObject()) : null);

  const u2 = await User.findOne({ email }).select("+password +passwordHash");
  console.log("Has password:", !!u2?.password);
  console.log("Has passwordHash:", !!u2?.passwordHash);

  const hash = u2?.password || u2?.passwordHash;
  console.log("Hash sample:", hash ? String(hash).slice(0, 25) + "..." : null);

  if (hash) {
    const ok = await bcrypt.compare("admin123", hash);
    console.log("bcrypt.compare('admin123', hash) =>", ok);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});