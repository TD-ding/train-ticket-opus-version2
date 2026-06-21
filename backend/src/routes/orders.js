// 订单路由：下单、查看我的订单、退票。
const express = require("express");
const { load, save } = require("../db");
const { auth } = require("../middleware/auth");

const router = express.Router();

// 下单购票：校验车次、座位类型与余票，扣减库存并生成订单。
router.post("/", auth, (req, res) => {
  const { trainId, seatType, passenger } = req.body || {};
  if (!trainId || !seatType || !passenger) {
    return res.status(400).json({ error: "车次、座位类型和乘客信息不能为空" });
  }
  const db = load();
  const train = db.trains.find((t) => t.id === trainId);
  if (!train) {
    return res.status(404).json({ error: "车次不存在" });
  }
  const seat = train.seats[seatType];
  if (!seat) {
    return res.status(400).json({ error: "座位类型不存在" });
  }
  if (seat.sold >= seat.total) {
    return res.status(409).json({ error: "该座位类型已售罄" });
  }
  // 扣减余票，保证库存一致性。
  seat.sold += 1;
  const order = {
    id: "O" + Date.now(),
    userId: req.user.id,
    trainId,
    trainNo: train.trainNo,
    from: train.from,
    to: train.to,
    date: train.date,
    departTime: train.departTime,
    seatType,
    price: seat.price,
    passenger,
    status: "paid",
    createdAt: new Date().toISOString()
  };
  db.orders.push(order);
  save();
  res.status(201).json(order);
});

// 查看当前用户的所有订单。
router.get("/mine", auth, (req, res) => {
  const db = load();
  const mine = db.orders.filter((o) => o.userId === req.user.id);
  res.json(mine);
});

// 退票：仅能退自己的、且未退过的订单，退票后回补库存。
router.post("/:id/cancel", auth, (req, res) => {
  const db = load();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order || order.userId !== req.user.id) {
    return res.status(404).json({ error: "订单不存在" });
  }
  if (order.status === "cancelled") {
    return res.status(400).json({ error: "订单已退票" });
  }
  order.status = "cancelled";
  // 回补对应车次座位库存。
  const train = db.trains.find((t) => t.id === order.trainId);
  if (train && train.seats[order.seatType] && train.seats[order.seatType].sold > 0) {
    train.seats[order.seatType].sold -= 1;
  }
  save();
  res.json(order);
});

module.exports = router;
