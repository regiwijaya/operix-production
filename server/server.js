import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import importRoutes from "./routes/importRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/api", (_req, res) => {
  res.send("Company System API is running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/import", importRoutes);

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const HOST = "0.0.0.0";

// Server start dulu, supaya tidak 503 total walaupun Mongo gagal
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Koneksi database di belakang
(async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ MongoDB failed, server tetap jalan:", err?.message || err);
  }
})();