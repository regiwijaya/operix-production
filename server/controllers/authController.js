import User from "../models/User.js";
import bcrypt from "bcryptjs";
import {
  signAccessToken,
  signRefreshToken,
  verifyToken,
} from "../config/jwt.js";

function buildAccessPayload(user) {
  return {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
  };
}

function cookieOptions() {
  const isProduction = process.env.NODE_ENV === "production";

  return {
    httpOnly: true,
    sameSite: isProduction ? "none" : "lax",
    secure: isProduction,
    path: "/",
  };
}

// 0) Seed admin pertama (hanya jika belum ada admin)
export async function seedAdmin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email & password wajib" });
    }

    const adminExists = await User.findOne({ role: "admin" });
    if (adminExists) {
      return res
        .status(409)
        .json({ message: "Admin sudah ada. Seed ditolak." });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: "Email sudah terpakai." });
    }

    const passwordHash = await User.hashPassword(password);
    const admin = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
    });

    return res.status(201).json({
      message: "Admin dibuat",
      user: { id: admin._id, email: admin.email, role: admin.role },
    });
  } catch (err) {
    next(err);
  }
}

// 1) Login
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email & password wajib" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      isActive: true,
    });

    if (!user) {
      return res.status(401).json({ message: "Email/password salah" });
    }

    const ok = await user.comparePassword(password);
    if (!ok) {
      return res.status(401).json({ message: "Email/password salah" });
    }

    const accessToken = signAccessToken(
      buildAccessPayload(user),
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES || "15m"
    );

    const refreshToken = signRefreshToken(
      { sub: user._id.toString() },
      process.env.JWT_REFRESH_SECRET,
      process.env.REFRESH_TOKEN_EXPIRES || "7d"
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// 2) Refresh access token
export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "Missing refresh token" });
    }

    let decoded;
    try {
      decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const user = await User.findById(decoded.sub);

    if (!user || !user.isActive) {
      return res.status(401).json({ message: "User not found/inactive" });
    }

    if (!user.refreshTokenHash) {
      return res
        .status(401)
        .json({ message: "Refresh token not registered" });
    }

    const match = await bcrypt.compare(token, user.refreshTokenHash);

    if (!match) {
      return res.status(401).json({ message: "Refresh token mismatch" });
    }

    const accessToken = signAccessToken(
      buildAccessPayload(user),
      process.env.JWT_ACCESS_SECRET,
      process.env.ACCESS_TOKEN_EXPIRES || "15m"
    );

    return res.json({
      accessToken,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

// 3) Logout
export async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;

    if (token) {
      try {
        const decoded = verifyToken(token, process.env.JWT_REFRESH_SECRET);
        await User.findByIdAndUpdate(decoded.sub, { refreshTokenHash: null });
      } catch {
        // ignore
      }
    }

    res.clearCookie("refreshToken", cookieOptions());
    return res.json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

// 4) Get me
export async function me(req, res) {
  return res.json({ user: req.user });
}