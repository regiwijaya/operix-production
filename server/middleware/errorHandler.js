// server/middleware/errorHandler.js

export function errorHandler(err, req, res, next) {
  console.error("🔥 Server Error:", err);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}