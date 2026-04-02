import mongoose from "mongoose";

export const connectDB = async (mongoURI) => {
  try {
    if (!mongoURI) {
      throw new Error("MONGO_URI tidak ditemukan di .env");
    }

    const conn = await mongoose.connect(mongoURI);

    console.log("Connected to:", conn.connection.host);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};