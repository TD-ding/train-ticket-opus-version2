// 数据访问层：基于 JSON 文件的轻量持久化。
// 选择文件存储是为了零外部依赖即可运行整套流程，便于演示与本地部署。
const fs = require("fs");
const path = require("path");

// 数据文件统一存放在 data/ 目录，运行时自动创建。
const DATA_DIR = path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// 内存中的数据快照，所有读写都先作用于此，再落盘。
let cache = null;

// 初始种子数据：内置若干车次，方便首次启动即可检索。
function seed() {
  return {
    users: [],
    trains: [
      {
        id: "T1",
        trainNo: "G101",
        from: "北京南",
        to: "上海虹桥",
        date: "2026-07-01",
        departTime: "08:00",
        arriveTime: "12:30",
        seats: {
          business: { price: 1748, total: 20, sold: 0 },
          first: { price: 933, total: 60, sold: 0 },
          second: { price: 553, total: 200, sold: 0 }
        }
      },
      {
        id: "T2",
        trainNo: "G103",
        from: "北京南",
        to: "上海虹桥",
        date: "2026-07-01",
        departTime: "09:00",
        arriveTime: "13:28",
        seats: {
          business: { price: 1748, total: 20, sold: 0 },
          first: { price: 933, total: 60, sold: 0 },
          second: { price: 553, total: 200, sold: 0 }
        }
      },
      {
        id: "T3",
        trainNo: "G7",
        from: "上海虹桥",
        to: "北京南",
        date: "2026-07-02",
        departTime: "07:00",
        arriveTime: "11:29",
        seats: {
          business: { price: 1748, total: 20, sold: 0 },
          first: { price: 933, total: 60, sold: 0 },
          second: { price: 553, total: 200, sold: 0 }
        }
      }
    ],
    orders: []
  };
}

// 从磁盘加载数据；文件不存在则写入种子数据。
function load() {
  if (cache) return cache;
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    cache = seed();
    save();
  } else {
    cache = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  }
  return cache;
}

// 将内存快照持久化到磁盘。
function save() {
  fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2), "utf-8");
}

// 生成带前缀的唯一 ID。仅用时间戳在同一毫秒内会碰撞，
// 这里追加一个递增计数与随机段，保证并发创建时也不重复。
let counter = 0;
function genId(prefix) {
  counter = (counter + 1) % 100000;
  return prefix + Date.now().toString(36) + counter.toString(36) + Math.random().toString(36).slice(2, 6);
}

module.exports = { load, save, genId };
