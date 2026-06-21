// 管理员路由：车次的增删改查与订单总览，全部需要管理员权限。
const express = require("express");
const { load, save } = require("../db");
const { auth, adminOnly } = require("../middleware/auth");
const { SEAT_TYPES } = require("../constants");

const router = express.Router();

// 所有管理接口统一要求登录 + 管理员角色。
router.use(auth, adminOnly);

// 新增车次。
router.post("/trains", (req, res) => {
  const { trainNo, from, to, date, departTime, arriveTime, seats } = req.body || {};
  if (!trainNo || !from || !to || !date || !departTime || !arriveTime || !seats) {
    return res.status(400).json({ error: "车次信息不完整" });
  }
  // 校验座位类型合法，避免写入未知座位键。
  const invalid = Object.keys(seats).filter((k) => !SEAT_TYPES.includes(k));
  if (invalid.length) {
    return res.status(400).json({ error: "存在无效的座位类型: " + invalid.join(", ") });
  }
  const db = load();
  const train = {
    id: "T" + Date.now(),
    trainNo,
    from,
    to,
    date,
    departTime,
    arriveTime,
    seats
  };
  db.trains.push(train);
  save();
  res.status(201).json(train);
});

// 修改车次信息。
router.put("/trains/:id", (req, res) => {
  const db = load();
  const train = db.trains.find((t) => t.id === req.params.id);
  if (!train) {
    return res.status(404).json({ error: "车次不存在" });
  }
  Object.assign(train, req.body, { id: train.id });
  save();
  res.json(train);
});

// 删除车次。
router.delete("/trains/:id", (req, res) => {
  const db = load();
  const idx = db.trains.findIndex((t) => t.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: "车次不存在" });
  }
  db.trains.splice(idx, 1);
  save();
  res.json({ message: "删除成功" });
});

// 查看全部订单（运营总览）。
router.get("/orders", (req, res) => {
  const db = load();
  res.json(db.orders);
});

// 运营统计：车次数、订单数、有效订单售出票数与营收。
router.get("/stats", (req, res) => {
  const db = load();
  const paid = db.orders.filter((o) => o.status === "paid");
  const ticketsSold = paid.reduce((sum, o) => sum + (o.quantity || 1), 0);
  const revenue = paid.reduce((sum, o) => sum + (o.totalPrice || o.price), 0);
  res.json({
    trains: db.trains.length,
    orders: db.orders.length,
    paidOrders: paid.length,
    ticketsSold,
    revenue
  });
});

module.exports = router;
