// 我的订单页逻辑：展示当前用户订单并支持退票。
// 座位类型映射统一来自 common.js 的 seatName。

// 加载并渲染订单列表。
async function loadOrders() {
  const box = document.getElementById("orderList");
  const auth = getAuth();
  if (!auth) {
    box.innerHTML = '<div class="empty">请先在首页登录后查看订单</div>';
    return;
  }
  try {
    const orders = await request("/orders/mine");
    if (!orders.length) {
      box.innerHTML = '<div class="empty">还没有订单，快去购票吧</div>';
      return;
    }
    box.innerHTML = "";
    orders.reverse().forEach((o) => box.appendChild(renderOrder(o)));
  } catch (err) {
    toast(err.message);
  }
}

// 渲染单个订单卡片。
function renderOrder(o) {
  const div = document.createElement("div");
  div.className = "order-card";
  const statusText = o.status === "paid" ? "已支付" : "已退票";
  div.innerHTML = `
    <div class="train-head">
      <span class="train-no">${o.trainNo}</span>
      <span class="status ${o.status}">${statusText}</span>
    </div>
    <div class="route">
      <span class="time">${o.departTime} ${o.from}</span>
      <span class="arrow">→</span>
      <span class="time">${o.to}</span>
    </div>
    <div class="seats">
      <span class="seat-tag">${o.date}</span>
      <span class="seat-tag">${seatName(o.seatType)}</span>
      <span class="seat-tag">乘客：${o.passenger}</span>
      <span class="seat-tag">${o.quantity || 1} 张</span>
      <span class="seat-tag">合计 ¥${o.totalPrice || o.price}</span>
    </div>`;
  if (o.status === "paid") {
    const wrap = document.createElement("div");
    wrap.style.cssText = "margin-top:12px;text-align:right;";
    const btn = document.createElement("button");
    btn.className = "btn danger small";
    btn.textContent = "退票";
    btn.onclick = () => cancelOrder(o.id);
    wrap.appendChild(btn);
    div.appendChild(wrap);
  }
  return div;
}

// 退票操作，操作前二次确认避免误触。
async function cancelOrder(id) {
  if (!confirm("确定要退票吗？退票后座位将释放。")) return;
  try {
    await request(`/orders/${id}/cancel`, { method: "POST" });
    toast("退票成功");
    loadOrders();
  } catch (err) {
    toast(err.message);
  }
}

document.addEventListener("DOMContentLoaded", loadOrders);
