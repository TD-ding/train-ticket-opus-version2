// JWT 认证与权限中间件。
const jwt = require("jsonwebtoken");

// 密钥从环境变量读取，提供默认值以便本地直接运行。
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// 签发 token，载荷包含用户 id、用户名和角色。
function sign(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: "2h" }
  );
}

// 校验请求头中的 Bearer token，成功则把用户信息挂到 req.user。
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "未登录或缺少凭证" });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: "凭证无效或已过期" });
  }
}

// 要求管理员角色，需在 auth 之后使用。
function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "需要管理员权限" });
  }
  next();
}

module.exports = { sign, auth, adminOnly, JWT_SECRET };
