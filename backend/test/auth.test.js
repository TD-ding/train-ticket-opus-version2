// 认证相关测试：注册、登录、参数校验。
const path = require("path");
const fs = require("fs");
const os = require("os");

// 每个测试套件使用独立临时数据文件，避免相互污染。
process.env.DB_FILE = path.join(os.tmpdir(), `ttest-auth-${Date.now()}.json`);

const request = require("supertest");
const app = require("../src/server");

afterAll(() => {
  if (fs.existsSync(process.env.DB_FILE)) fs.unlinkSync(process.env.DB_FILE);
});

describe("认证接口", () => {
  test("注册成功", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "tom", password: "123456" });
    expect(res.status).toBe(201);
  });

  test("缺少密码返回 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "noPwd" });
    expect(res.status).toBe(400);
  });

  test("密码过短返回 400", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "shortPwd", password: "123" });
    expect(res.status).toBe(400);
  });

  test("重复用户名返回 409", async () => {
    await request(app).post("/api/auth/register").send({ username: "dup", password: "123456" });
    const res = await request(app)
      .post("/api/auth/register")
      .send({ username: "dup", password: "123456" });
    expect(res.status).toBe(409);
  });

  test("登录成功返回 token", async () => {
    await request(app).post("/api/auth/register").send({ username: "jane", password: "123456" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "jane", password: "123456" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.role).toBe("user");
  });

  test("密码错误返回 401", async () => {
    await request(app).post("/api/auth/register").send({ username: "kate", password: "123456" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "kate", password: "wrongpass" });
    expect(res.status).toBe(401);
  });

  test("用户名首尾空格被忽略", async () => {
    await request(app).post("/api/auth/register").send({ username: "  spaced  ", password: "123456" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ username: "spaced", password: "123456" });
    expect(res.status).toBe(200);
  });
});
