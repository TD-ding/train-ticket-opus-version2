// 车次查询路由：按出发地、到达地、日期检索。
const express = require("express");
const { load } = require("../db");

const router = express.Router();

// 查询车次，支持 from / to / date 三个可选过滤条件。
router.get("/", (req, res) => {
  const { from, to, date } = req.query;
  const db = load();
  let result = db.trains;
  if (from) result = result.filter((t) => t.from.includes(from));
  if (to) result = result.filter((t) => t.to.includes(to));
  if (date) result = result.filter((t) => t.date === date);
  res.json(result);
});

// 获取单个车次详情，用于下单前确认。
router.get("/:id", (req, res) => {
  const db = load();
  const train = db.trains.find((t) => t.id === req.params.id);
  if (!train) {
    return res.status(404).json({ error: "车次不存在" });
  }
  res.json(train);
});

module.exports = router;
