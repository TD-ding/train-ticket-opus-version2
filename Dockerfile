# 火车票订购系统后端镜像
FROM node:18-alpine

# 工作目录
WORKDIR /app

# 先复制依赖清单以利用构建缓存
COPY backend/package.json backend/package-lock.json ./

# 仅安装生产依赖
RUN npm install --omit=dev

# 复制后端源码与前端、管理端静态资源
# server.js 通过 ../../frontend、../../admin 引用静态目录，对应容器内 /frontend、/admin
COPY backend/src ./src
COPY frontend /frontend
COPY admin /admin

# 使用非 root 用户运行，提升安全性
RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /app/src/data && chown -R app:app /app /frontend /admin
USER app

# 服务端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# 启动服务
CMD ["node", "src/server.js"]
