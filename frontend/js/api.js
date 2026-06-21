// 前端 API 封装：统一处理基础地址、token 与错误。
const API_BASE = "/api";

// 从 localStorage 读取登录态。
function getAuth() {
  const raw = localStorage.getItem("auth");
  return raw ? JSON.parse(raw) : null;
}

// 保存登录态。
function setAuth(auth) {
  localStorage.setItem("auth", JSON.stringify(auth));
}

// 清除登录态（退出）。
function clearAuth() {
  localStorage.removeItem("auth");
}

// 统一请求函数，自动附带 token，并把后端错误抛为异常。
async function request(path, options = {}) {
  const auth = getAuth();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (auth && auth.token) headers.Authorization = "Bearer " + auth.token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "请求失败");
  }
  return data;
}

// 简易顶部提示。
function toast(msg) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2200);
}
