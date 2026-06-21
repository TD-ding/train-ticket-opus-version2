# 部署文档

## 环境要求

- Node.js ≥ 18
- npm ≥ 9
- （可选）Docker ≥ 20 与 Docker Compose v2

## 方式一：本地 Node 运行

```bash
cd backend
npm install
npm start          # 默认监听 3000 端口
```

访问：
- 用户端：http://localhost:3000/
- 管理后台：http://localhost:3000/admin/ （默认 `admin` / `admin123`）

后端通过 Express 静态托管同时对外提供用户前端与管理后台，单进程即可运行整套系统。

### 测试与 Lint

```bash
cd backend
npm run lint       # ESLint 检查
npm test           # Jest + Supertest 单元测试
```

## 方式二：Docker Compose 运行

在项目根目录：

```bash
docker compose up --build
```

服务默认映射到宿主机 `3000` 端口，可用 `HOST_PORT` 覆盖：

```bash
HOST_PORT=8080 docker compose up --build -d
```

数据文件通过命名卷 `ticket-data` 持久化，容器重建后用户与订单不丢失。

## 环境变量

复制 `.env.example` 为 `.env` 并按需修改。Docker Compose 会读取同名变量。

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 容器内服务端口 | 3000 |
| `HOST_PORT` | 宿主机映射端口（仅 compose 用） | 3000 |
| `JWT_SECRET` | JWT 签名密钥（生产务必修改） | dev-secret-change-me |
| `ADMIN_USERNAME` | 默认管理员账号 | admin |
| `ADMIN_PASSWORD` | 默认管理员密码 | admin123 |
| `DB_FILE` | 数据文件路径（测试隔离用） | src/data/db.json |

## 生产注意事项

- 务必通过环境变量重设 `JWT_SECRET` 与管理员密码，不要使用默认值。
- JSON 文件持久化适合演示与轻量场景；高并发或多实例部署应改用数据库。
- 反向代理（Nginx 等）建议开启 HTTPS 并转发到容器的 3000 端口。

## CI / CD

- `.github/workflows/ci.yml`：Pull Request 触发，执行 `npm install` → ESLint → Jest。
- `.github/workflows/cd.yml`：推送到 `main` 触发，验证 Docker 镜像构建。
