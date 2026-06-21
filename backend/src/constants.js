// 后端共享常量：座位类型集中定义，便于校验与前后端口径一致。
const SEAT_TYPES = ["business", "first", "second"];

const SEAT_NAMES = {
  business: "商务座",
  first: "一等座",
  second: "二等座"
};

module.exports = { SEAT_TYPES, SEAT_NAMES };
