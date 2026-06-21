// 管理后台逻辑：登录、车次增删改、订单总览。
const API_BASE = "/api";
let token = null;

// 顶部提示。
function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 2200);
}

// 通用请求，自动附带管理员 token。
async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = "Bearer " + token;
  const res = await fetch(API_BASE + path, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "请求失败");
  return data;
}

// 座位类型代码转中文。
function seatName(code) {
  return { business: "商务座", first: "一等座", second: "二等座" }[code] || code;
}

// 管理员登录。
async function adminLogin() {
  const username = document.getElementById("adminUser").value.trim();
  const password = document.getElementById("adminPass").value;
  try {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password })
    });
    if (data.role !== "admin") {
      toast("该账号不是管理员");
      return;
    }
    token = data.token;
    document.getElementById("adminName").textContent = data.username;
    document.getElementById("loginView").classList.add("hidden");
    document.getElementById("adminView").classList.remove("hidden");
    loadTrains();
  } catch (err) {
    toast(err.message);
  }
}

// 加载车次列表。
async function loadTrains() {
  const trains = await request("/trains");
  const body = document.getElementById("trainBody");
  body.innerHTML = "";
  trains.forEach((t) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${t.trainNo}</td><td>${t.from}</td><td>${t.to}</td><td>${t.date}</td>
      <td>${t.departTime}</td><td>${t.arriveTime}</td>
      <td>¥${t.seats.second ? t.seats.second.price : "-"}</td>
      <td></td>`;
    const ops = tr.querySelector("td:last-child");
    const edit = document.createElement("button");
    edit.className = "btn small";
    edit.textContent = "编辑";
    edit.onclick = () => openTrainModal(t);
    const del = document.createElement("button");
    del.className = "btn danger small";
    del.textContent = "删除";
    del.style.marginLeft = "6px";
    del.onclick = () => deleteTrain(t.id);
    ops.append(edit, del);
    body.appendChild(tr);
  });
}

// 加载订单总览。
async function loadOrders() {
  const orders = await request("/admin/orders");
  const body = document.getElementById("orderBody");
  body.innerHTML = "";
  orders.slice().reverse().forEach((o) => {
    const tr = document.createElement("tr");
    const statusText = o.status === "paid" ? "已支付" : "已退票";
    tr.innerHTML = `
      <td>${o.id}</td><td>${o.trainNo}</td><td>${o.from}→${o.to}</td>
      <td>${seatName(o.seatType)}</td><td>${o.passenger}</td><td>¥${o.price}</td>
      <td><span class="status ${o.status}">${statusText}</span></td>
      <td>${new Date(o.createdAt).toLocaleString("zh-CN")}</td>`;
    body.appendChild(tr);
  });
}

// 打开车次弹窗（新增或编辑）。
function openTrainModal(train) {
  document.getElementById("trainModalTitle").textContent = train ? "编辑车次" : "新增车次";
  document.getElementById("trainId").value = train ? train.id : "";
  document.getElementById("f_trainNo").value = train ? train.trainNo : "";
  document.getElementById("f_from").value = train ? train.from : "";
  document.getElementById("f_to").value = train ? train.to : "";
  document.getElementById("f_date").value = train ? train.date : "";
  document.getElementById("f_depart").value = train ? train.departTime : "";
  document.getElementById("f_arrive").value = train ? train.arriveTime : "";
  const s = train ? train.seats : {};
  document.getElementById("f_business").value = s.business ? `${s.business.price}/${s.business.total}` : "";
  document.getElementById("f_first").value = s.first ? `${s.first.price}/${s.first.total}` : "";
  document.getElementById("f_second").value = s.second ? `${s.second.price}/${s.second.total}` : "";
  document.getElementById("trainModal").classList.remove("hidden");
}

// 解析 "价格/数量" 为座位对象，保留已售数。
function parseSeat(value, existing) {
  if (!value) return null;
  const [price, total] = value.split("/").map((v) => parseInt(v.trim(), 10));
  return { price: price || 0, total: total || 0, sold: existing ? existing.sold : 0 };
}

// 保存车次（新增或更新）。
async function saveTrain(e) {
  e.preventDefault();
  const id = document.getElementById("trainId").value;
  const seats = {};
  const b = parseSeat(document.getElementById("f_business").value);
  const f = parseSeat(document.getElementById("f_first").value);
  const sd = parseSeat(document.getElementById("f_second").value);
  if (b) seats.business = b;
  if (f) seats.first = f;
  if (sd) seats.second = sd;
  const payload = {
    trainNo: document.getElementById("f_trainNo").value.trim(),
    from: document.getElementById("f_from").value.trim(),
    to: document.getElementById("f_to").value.trim(),
    date: document.getElementById("f_date").value,
    departTime: document.getElementById("f_depart").value.trim(),
    arriveTime: document.getElementById("f_arrive").value.trim(),
    seats
  };
  try {
    if (id) {
      await request(`/admin/trains/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      toast("车次已更新");
    } else {
      await request("/admin/trains", { method: "POST", body: JSON.stringify(payload) });
      toast("车次已新增");
    }
    document.getElementById("trainModal").classList.add("hidden");
    loadTrains();
  } catch (err) {
    toast(err.message);
  }
}

// 删除车次。
async function deleteTrain(id) {
  if (!confirm("确定删除该车次？")) return;
  try {
    await request(`/admin/trains/${id}`, { method: "DELETE" });
    toast("已删除");
    loadTrains();
  } catch (err) {
    toast(err.message);
  }
}

// 切换车次 / 订单视图。
function switchView(view) {
  document.querySelectorAll(".atab").forEach((t) => t.classList.toggle("active", t.dataset.view === view));
  document.getElementById("trainsPanel").classList.toggle("hidden", view !== "trains");
  document.getElementById("ordersPanel").classList.toggle("hidden", view !== "orders");
  if (view === "trains") loadTrains();
  else loadOrders();
}

// 事件绑定。
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("adminLoginBtn").onclick = adminLogin;
  document.getElementById("logoutBtn").onclick = () => location.reload();
  document.getElementById("addTrainBtn").onclick = () => openTrainModal(null);
  document.getElementById("closeTrain").onclick = () =>
    document.getElementById("trainModal").classList.add("hidden");
  document.getElementById("trainForm").addEventListener("submit", saveTrain);
  document.querySelectorAll(".atab").forEach((t) => {
    t.onclick = () => switchView(t.dataset.view);
  });
});
