// 用户认证路由：注册与登录。
const express = require("express");
const bcrypt = require("bcryptjs");
const { load, save } = require("../db");
const { sign } = require("../middleware/auth");

const router = express.Router();

// 用户注册：用户名唯一，密码加密存储，默认普通用户角色。
router.post("/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "密码至少 6 位" });
  }
  const db = load();
  if (db.users.some((u) => u.username === username)) {
    return res.status(409).json({ error: "用户名已存在" });
  }
  const user = {
    id: "U" + Date.now(),
    username,
    password: bcrypt.hashSync(password, 10),
    role: "user"
  };
  db.users.push(user);
  save();
  res.status(201).json({ message: "注册成功" });
});

// 用户登录：校验密码，成功返回 token 和基本信息。
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "用户名和密码不能为空" });
  }
  const db = load();
  const user = db.users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: "用户名或密码错误" });
  }
  const token = sign(user);
  res.json({ token, username: user.username, role: user.role });
});

module.exports = router;
