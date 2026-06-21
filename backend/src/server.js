// 应用入口：装配 Express 应用、中间件与各业务路由。
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const { load, save } = require("./db");

const authRoutes = require("./routes/auth");
const trainRoutes = require("./routes/trains");
const orderRoutes = require("./routes/orders");
const adminRoutes = require("./routes/admin");

const app = express();

// 跨域与 JSON 解析中间件。
app.use(cors());
app.use(express.json());

// 静态托管前端用户端与管理端页面，方便单体部署。
app.use("/", express.static(path.join(__dirname, "../../frontend")));
app.use("/admin", express.static(path.join(__dirname, "../../admin")));

// 业务路由挂载。
app.use("/api/auth", authRoutes);
app.use("/api/trains", trainRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// 健康检查端点，供容器与 CI 探活。
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// 首次启动时确保存在一个默认管理员账号，便于演示。
function ensureAdmin() {
  const db = load();
  if (!db.users.some((u) => u.role === "admin")) {
    db.users.push({
      id: "U-admin",
      username: process.env.ADMIN_USERNAME || "admin",
      password: bcrypt.hashSync(process.env.ADMIN_PASSWORD || "admin123", 10),
      role: "admin"
    });
    save();
  }
}

const PORT = process.env.PORT || 3000;

// 仅在直接运行时启动监听；被测试引入时不自动监听。
if (require.main === module) {
  ensureAdmin();
  app.listen(PORT, () => {
    console.log(`Train ticket server running on port ${PORT}`);
  });
}

module.exports = app;
