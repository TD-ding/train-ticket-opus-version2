// 车次查询与订单流程测试：查询、购票、余票扣减、退票回补、权限。
const path = require("path");
const fs = require("fs");
const os = require("os");

process.env.DB_FILE = path.join(os.tmpdir(), `ttest-orders-${Date.now()}.json`);

const request = require("supertest");
const app = require("../src/server");

let token;

beforeAll(async () => {
  await request(app).post("/api/auth/register").send({ username: "buyer", password: "123456" });
  const res = await request(app).post("/api/auth/login").send({ username: "buyer", password: "123456" });
  token = res.body.token;
});

afterAll(() => {
  if (fs.existsSync(process.env.DB_FILE)) fs.unlinkSync(process.env.DB_FILE);
});

describe("车次查询", () => {
  test("返回种子车次列表", async () => {
    const res = await request(app).get("/api/trains");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("按出发地过滤", async () => {
    const res = await request(app).get("/api/trains").query({ from: "北京" });
    expect(res.status).toBe(200);
    res.body.forEach((t) => expect(t.from).toContain("北京"));
  });

  test("不存在的车次详情返回 404", async () => {
    const res = await request(app).get("/api/trains/NOPE");
    expect(res.status).toBe(404);
  });
});

describe("订单流程", () => {
  test("未登录购票返回 401", async () => {
    const res = await request(app)
      .post("/api/orders")
      .send({ trainId: "T1", seatType: "second", passenger: "张三" });
    expect(res.status).toBe(401);
  });

  test("购票成功并扣减余票", async () => {
    const before = (await request(app).get("/api/trains/T1")).body.seats.second.sold;
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ trainId: "T1", seatType: "second", passenger: "张三", quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.quantity).toBe(2);
    expect(res.body.totalPrice).toBe(res.body.price * 2);
    const after = (await request(app).get("/api/trains/T1")).body.seats.second.sold;
    expect(after - before).toBe(2);
  });

  test("超量购票返回 409", async () => {
    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${token}`)
      .send({ trainId: "T1", seatType: "second", passenger: "张三", quantity: 99 });
    expect(res.status).toBe(400);
  });

  test("查看我的订单", async () => {
    const res = await request(app)
      .get("/api/orders/mine")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test("退票回补库存", async () => {
    const order = (await request(app).get("/api/orders/mine").set("Authorization", `Bearer ${token}`)).body[0];
    const before = (await request(app).get("/api/trains/T1")).body.seats.second.sold;
    const res = await request(app)
      .post(`/api/orders/${order.id}/cancel`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("cancelled");
    const after = (await request(app).get("/api/trains/T1")).body.seats.second.sold;
    expect(before - after).toBe(order.quantity || 1);
  });
});

describe("管理员权限", () => {
  test("普通用户访问管理接口返回 403", async () => {
    const res = await request(app)
      .get("/api/admin/orders")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  test("管理员可查看统计", async () => {
    const login = await request(app).post("/api/auth/login").send({ username: "admin", password: "admin123" });
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("revenue");
  });

  test("新增非法座位类型返回 400", async () => {
    const login = await request(app).post("/api/auth/login").send({ username: "admin", password: "admin123" });
    const res = await request(app)
      .post("/api/admin/trains")
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ trainNo: "X1", from: "a", to: "b", date: "2026-07-01", departTime: "08:00", arriveTime: "10:00", seats: { vip: { price: 1, total: 1, sold: 0 } } });
    expect(res.status).toBe(400);
  });
});
