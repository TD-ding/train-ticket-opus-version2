// 用户端首页逻辑：查询车次、登录注册、下单。
let currentTrain = null;

// 渲染右上角用户状态区。
function renderUserBox() {
  const box = document.getElementById("userBox");
  const auth = getAuth();
  if (auth) {
    box.textContent = `${auth.username}（退出）`;
    box.onclick = () => { clearAuth(); renderUserBox(); toast("已退出登录"); };
  } else {
    box.textContent = "登录 / 注册";
    box.onclick = () => openAuth();
  }
}

// 打开登录弹窗。
function openAuth() {
  document.getElementById("authModal").classList.remove("hidden");
}

// 查询并渲染车次列表。
async function searchTrains(e) {
  if (e) e.preventDefault();
  const from = document.getElementById("from").value.trim();
  const to = document.getElementById("to").value.trim();
  const date = document.getElementById("date").value;
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  if (date) params.append("date", date);
  const box = document.getElementById("results");
  // 查询期间显示加载提示，避免空白等待。
  box.innerHTML = '<div class="empty">正在查询车次…</div>';
  try {
    const trains = await request("/trains?" + params.toString());
    box.innerHTML = "";
    if (!trains.length) {
      box.innerHTML = '<div class="empty">没有找到符合条件的车次</div>';
      return;
    }
    trains.forEach((t) => box.appendChild(renderTrain(t)));
  } catch (err) {
    box.innerHTML = '<div class="empty">查询失败，请稍后重试</div>';
    toast(err.message);
  }
}

// 渲染单个车次卡片。
function renderTrain(t) {
  const div = document.createElement("div");
  div.className = "train-card";
  const seatTags = Object.entries(t.seats)
    .map(([k, s]) => {
      const left = s.total - s.sold;
      const name = seatName(k);
      const cls = left <= 0 ? "sold-out" : "";
      const leftText = left <= 0 ? "无票" : left;
      return `<span class="seat-tag ${cls}">${name} ¥${s.price} 余<b>${leftText}</b></span>`;
    })
    .join("");
  // 全部座位售罄时禁用购票按钮。
  const totalLeft = Object.values(t.seats).reduce((sum, s) => sum + (s.total - s.sold), 0);
  const bookDisabled = totalLeft <= 0 ? "disabled" : "";
  const bookLabel = totalLeft <= 0 ? "已售罄" : "购票";
  div.innerHTML = `
    <div class="train-head">
      <span class="train-no">${t.trainNo}</span>
      <span>${t.date}</span>
    </div>
    <div class="route">
      <span class="time">${t.departTime} ${t.from}</span>
      <span class="arrow">→</span>
      <span class="time">${t.arriveTime} ${t.to}</span>
    </div>
    <div class="seats">${seatTags}</div>
    <div style="margin-top:12px;text-align:right;">
      <button class="btn primary small" ${bookDisabled}>${bookLabel}</button>
    </div>`;
  const btn = div.querySelector("button");
  if (totalLeft > 0) btn.onclick = () => openBook(t);
  return div;
}

// 座位类型代码转中文（统一定义见 common.js 的 seatName）。

// 打开购票弹窗。
function openBook(train) {
  const auth = getAuth();
  if (!auth) {
    toast("请先登录");
    openAuth();
    return;
  }
  currentTrain = train;
  const select = document.getElementById("seatType");
  // 售罄的座位类型禁止选择，并在文案上标注。
  select.innerHTML = Object.entries(train.seats)
    .map(([k, s]) => {
      const left = s.total - s.sold;
      const disabled = left <= 0 ? "disabled" : "";
      const tail = left <= 0 ? "已售罄" : `余${left}`;
      return `<option value="${k}" ${disabled}>${seatName(k)} ¥${s.price}（${tail}）</option>`;
    })
    .join("");
  document.getElementById("bookTitle").textContent = `${train.trainNo} 购票`;
  document.getElementById("bookModal").classList.remove("hidden");
}

// 提交购票。
async function submitBook(e) {
  e.preventDefault();
  const seatType = document.getElementById("seatType").value;
  const passenger = document.getElementById("passenger").value.trim();
  const quantity = parseInt(document.getElementById("quantity").value, 10) || 1;
  if (!passenger) { toast("请输入乘客姓名"); return; }
  try {
    await request("/orders", {
      method: "POST",
      body: JSON.stringify({ trainId: currentTrain.id, seatType, passenger, quantity })
    });
    document.getElementById("bookModal").classList.add("hidden");
    toast("购票成功");
    searchTrains();
  } catch (err) {
    toast(err.message);
  }
}

// 提交登录或注册。
async function submitAuth(e) {
  e.preventDefault();
  const username = document.getElementById("authUsername").value.trim();
  const password = document.getElementById("authPassword").value;
  const mode = document.querySelector(".tab.active").dataset.tab;
  try {
    if (mode === "register") {
      await request("/auth/register", { method: "POST", body: JSON.stringify({ username, password }) });
      toast("注册成功，请登录");
      document.querySelector('.tab[data-tab="login"]').click();
    } else {
      const data = await request("/auth/login", { method: "POST", body: JSON.stringify({ username, password }) });
      setAuth(data);
      document.getElementById("authModal").classList.add("hidden");
      renderUserBox();
      toast("登录成功");
    }
  } catch (err) {
    toast(err.message);
  }
}

// 初始化事件绑定。
document.addEventListener("DOMContentLoaded", () => {
  renderUserBox();
  searchTrains();
  document.getElementById("searchForm").addEventListener("submit", searchTrains);
  document.getElementById("bookForm").addEventListener("submit", submitBook);
  document.getElementById("authForm").addEventListener("submit", submitAuth);
  document.getElementById("closeAuth").onclick = () =>
    document.getElementById("authModal").classList.add("hidden");
  document.getElementById("closeBook").onclick = () =>
    document.getElementById("bookModal").classList.add("hidden");
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.onclick = () => {
      document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
    };
  });
  // 点击弹窗遮罩层空白处关闭弹窗。
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });
});
