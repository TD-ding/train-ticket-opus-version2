// 前端共享常量与工具：座位类型映射等，避免在多个页面里重复定义。
const SEAT_NAMES = {
  business: "商务座",
  first: "一等座",
  second: "二等座"
};

// 座位类型代码转中文名称，找不到时回退为原始代码。
function seatName(code) {
  return SEAT_NAMES[code] || code;
}
