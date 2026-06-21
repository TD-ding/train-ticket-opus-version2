# 协作开发日志 · train-ticket-opus-version2

本项目按照协作开发工作流（collab-dev / collab-core）完成，模拟「生成会话 + 审查会话 + 主会话协调」三方角色，经过 5 轮迭代 + 基础设施 + 文档，共 7 个 PR 全部合并至 `main`。

- **仓库**：https://github.com/TD-ding/train-ticket-opus-version2
- **项目类型**：platform（前后端 + 管理后台）
- **技术栈**：Node.js + Express、JWT、bcryptjs、JSON 文件持久化；原生 HTML/CSS/JS 前端与管理后台；ESLint v9 / Jest / Supertest / Docker / GitHub Actions

## 协作角色

| 角色 | 职责 |
|------|------|
| 生成会话（Generator） | 全部代码编写、迭代修改、测试/Docker/CI、文档 |
| 审查会话（Reviewer） | 读取共享工作空间代码，给出质量/UX/功能/Bug/安全建议 |
| 主会话（Main） | 协调、将技术反馈模糊化为自然语言、创建并合并 PR、撰写本日志 |

每轮采用「两次提交」模式：初始实现提交 + 针对模糊化反馈的修复提交。

## 迭代记录

### 第 1 轮 · feat 初始版本（PR #1）
搭建项目骨架：Express 后端（auth/trains/orders/admin 路由、JWT 中间件、JSON 持久化与种子数据）、用户前端（查询/购票/订单）、管理后台（登录/车次管理/订单总览）、ESLint flat config 与基础配置文件、README。

### 第 2 轮 · refactor 代码质量优化（PR #2）
- **模糊化输入**：「代码里好多重复的地方能不能整理一下？颜色字体分散在各处能不能统一？出错了没什么提示。」
- 抽取座位类型常量（`constants.js`）、统一 API 错误返回结构、前端统一 `api.js` 请求封装与 toast 提示、消除重复代码。

### 第 3 轮 · feat 用户体验优化（PR #3）
- **模糊化输入**：「查询时一片空白能不能加加载提示？售罄的座位还能点。退票点完直接就没了想要个确认。」
- 加入查询加载/错误占位、售罄座位置灰禁用、退票二次确认、交互细节打磨。

### 第 4 轮 · feat 功能增强（PR #4）
- **模糊化输入**：「能不能一次买多张票？后台想看到经营数据。」
- 购票支持 1–5 张数量并计算总价、库存按数量扣减/回补、新增管理端运营统计接口 `/api/admin/stats` 与统计卡片。

### 第 5 轮 · fix Bug 修复（PR #5）
- **模糊化输入**：「改车次座位数时如果改得比卖出去的还少会出问题；用户名前后有空格会重复注册。」
- 修改车次时校验总座位数不得小于已售数、注册/登录用户名去首尾空格、边界与错误处理修复。

### Step 4 · 基础设施（PR #6）
- 单元测试：`backend/test/auth.test.js`（7 例）、`orders.test.js`（11 例），共 18 例通过，使用 `DB_FILE` 环境变量隔离临时数据文件。
- 核心模块补充注释；`Dockerfile`（node:18-alpine、非 root、HEALTHCHECK）、`docker-compose.yml`、`.dockerignore`、`.env.example`、`.gitignore`。
- 更新 `ci.yml`（install + lint + test）、新增 `cd.yml`（docker build）。合并前 CI 验证通过。

### Step 5 · 文档（PR #7）
新增 `docs/frontend.md`、`docs/backend.md`、`docs/admin-frontend.md`、`docs/deployment.md`，并校准 README.md 与文档、目录结构、运行方式一致。

## PR 汇总

| PR | 标题 |
|----|------|
| #1 | 第1轮: feat - 初始版本 |
| #2 | 第2轮: refactor - 代码质量优化 |
| #3 | 第3轮: feat - 用户体验优化 |
| #4 | 第4轮: feat - 功能增强 |
| #5 | 第5轮: fix - Bug修复 |
| #6 | feat: 添加单元测试 + Docker/CI 配置 |
| #7 | docs: 添加项目文档 |

## 工程结果

- ESLint 零错误，18 个单元测试全部通过。
- CI（PR 触发）执行 install → lint → test；CD（push main）验证 Docker 镜像构建。
- 单进程即可运行整套系统（后端静态托管前端与管理后台）。
