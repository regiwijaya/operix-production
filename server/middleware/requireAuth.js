import { verifyToken } from "../config/jwt.js";

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: missing token" });
    }

    const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
    };

    return next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: invalid/expired token" });
  }
}