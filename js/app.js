// -------- Mock Data --------
const orders = [
  { id: 1001, customer: "Sofia Martinez", date: "2026-01-26", amount: 129.99, status: "paid" },
  { id: 1002, customer: "Lucas Perez", date: "2026-01-27", amount: 59.50, status: "pending" },
  { id: 1003, customer: "Camila Gomez", date: "2026-01-27", amount: 210.0, status: "paid" },
  { id: 1004, customer: "Mateo Silva", date: "2026-01-28", amount: 49.9, status: "cancelled" },
  { id: 1005, customer: "Valentina Rojas", date: "2026-01-28", amount: 88.4, status: "refunded" },
  { id: 1006, customer: "Bruno Diaz", date: "2026-01-29", amount: 320.0, status: "paid" },
  { id: 1007, customer: "Martina Alvarez", date: "2026-01-29", amount: 74.99, status: "pending" },
  { id: 1008, customer: "Agustin Romero", date: "2026-01-30", amount: 145.0, status: "paid" },
  { id: 1009, customer: "Florencia Torres", date: "2026-01-30", amount: 39.99, status: "pending" },
  { id: 1010, customer: "Hernán Crespo", date: "2026-01-31", amount: 199.9, status: "paid" },
  { id: 1011, customer: "Mia Fernandez", date: "2026-01-31", amount: 22.5, status: "cancelled" },
  { id: 1012, customer: "Emma Herrera", date: "2026-02-01", amount: 110.0, status: "paid" }
];

// -------- State --------
const state = {
  q: "",
  status: "all",
  sort: "date_desc",
  page: 1,
  pageSize: 6
};

// -------- DOM Helpers --------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function on(el, event, handler) {
  if (!el) return;
  el.addEventListener(event, handler);
}

function formatMoney(value) {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  setTimeout(() => el.classList.remove("show"), 1800);
}

// -------- Data helpers --------
function getFiltered() {
  let data = [...orders];

  if (state.status !== "all") data = data.filter(o => o.status === state.status);

  if (state.q.trim()) {
    const q = state.q.toLowerCase();
    data = data.filter(o =>
      String(o.id).includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  }

  const sorters = {
    date_desc: (a, b) => new Date(b.date) - new Date(a.date),
    date_asc: (a, b) => new Date(a.date) - new Date(b.date),
    amount_desc: (a, b) => b.amount - a.amount,
    amount_asc: (a, b) => a.amount - b.amount
  };

  data.sort(sorters[state.sort] ?? sorters.date_desc);
  return data;
}

function paginate(items) {
  const start = (state.page - 1) * state.pageSize;
  return items.slice(start, start + state.pageSize);
}

// -------- Rendering --------
function badge(status) {
  const label = status[0].toUpperCase() + status.slice(1);
  return `<span class="badge ${status}">${label}</span>`;
}

function renderTable() {
  const tbody = $("#ordersTbody");
  const meta = $("#tableMeta");
  const pageInfo = $("#pageInfo");
  const prev = $("#prevPage");
  const next = $("#nextPage");

  // si no existe la tabla (o la sacaste), no rompas el JS
  if (!tbody || !meta || !pageInfo || !prev || !next) return;

  const filtered = getFiltered();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
  if (state.page > totalPages) state.page = totalPages;

  const rows = paginate(filtered).map(o => `
    <tr>
      <td>#${o.id}</td>
      <td>${o.customer}</td>
      <td>${o.date}</td>
      <td class="right">${formatMoney(o.amount)}</td>
      <td>${badge(o.status)}</td>
      <td class="right">
        <button class="btn" data-action="view" data-id="${o.id}">View</button>
        <button class="btn" data-action="refund" data-id="${o.id}">Refund</button>
      </td>
    </tr>
  `).join("");

  tbody.innerHTML = rows || `<tr><td colspan="6" class="muted">No results</td></tr>`;
  meta.textContent = `${total} result${total === 1 ? "" : "s"}`;
  pageInfo.textContent = `Page ${state.page} / ${totalPages}`;

  prev.disabled = state.page <= 1;
  next.disabled = state.page >= totalPages;
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function renderKpis() {
  const filtered = getFiltered();
  const revenue = filtered.reduce((acc, o) => acc + o.amount, 0);
  const paidOrders = filtered.filter(o => o.status === "paid");
  const refunds = filtered.filter(o => o.status === "refunded").length;
  const conversion = filtered.length ? (paidOrders.length / filtered.length) * 100 : 0;

  setText("#kpiRevenue", formatMoney(revenue));
  setText("#kpiOrders", String(filtered.length));
  setText("#kpiConversion", `${conversion.toFixed(0)}%`);
  setText("#kpiRefunds", String(refunds));

  setText("#kpiRevenueNote", "Based on current filters");
  setText("#kpiOrdersNote", "Orders in view");
  setText("#kpiConversionNote", "Paid / total");
  setText("#kpiRefundsNote", "Count refunded");
}

function renderQuickStats() {
  const filtered = getFiltered();
  const avg = filtered.length ? filtered.reduce((a, o) => a + o.amount, 0) / filtered.length : 0;

  const statusCounts = filtered.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  const topStatus = Object.entries(statusCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
  const uniqueCustomers = new Set(filtered.map(o => o.customer)).size;
  const pending = filtered.filter(o => o.status === "pending").length;

  setText("#avgOrder", formatMoney(avg));
  setText("#topStatus", topStatus === "—" ? "—" : (topStatus[0].toUpperCase() + topStatus.slice(1)));
  setText("#uniqueCustomers", String(uniqueCustomers));
  setText("#pendingOrders", String(pending));
}

function drawChart() {
  const canvas = $("#revenueChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const byDate = orders.reduce((acc, o) => {
    acc[o.date] = (acc[o.date] || 0) + o.amount;
    return acc;
  }, {});

  const dates = Object.keys(byDate).sort().slice(-7);
  const values = dates.map(d => byDate[d]);

  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const pad = 24;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;

  ctx.globalAlpha = 0.35;
  ctx.beginPath();
  ctx.moveTo(pad, pad);
  ctx.lineTo(pad, h - pad);
  ctx.lineTo(w - pad, h - pad);
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--border");
  ctx.stroke();
  ctx.globalAlpha = 1;

  const max = Math.max(...values, 1);
  const stepX = innerW / Math.max(values.length - 1, 1);

  ctx.beginPath();
  values.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = (h - pad) - (v / max) * innerH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue("--primary");
  ctx.lineWidth = 3;
  ctx.stroke();

  values.forEach((v, i) => {
    const x = pad + i * stepX;
    const y = (h - pad) - (v / max) * innerH;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue("--primary");
    ctx.fill();
  });
}

function renderAll() {
  renderKpis();
  renderQuickStats();
  renderTable();
}

// -------- Modal --------
const modal = $("#orderModal");
const closeModalBtn = $("#closeModalBtn");
const modalCloseBtn = $("#modalCloseBtn");
const modalRefundBtn = $("#modalRefundBtn");
const modalTitle = $("#modalTitle");
const modalSubtitle = $("#modalSubtitle");
const modalBody = $("#modalBody");

let modalOrderId = null;

function openModal(order) {
  if (!modal || !modalTitle || !modalSubtitle || !modalBody) return;

  modalOrderId = order.id;
  modal.classList.add("open");
  modal.setAttribute("aria-hidden", "false");

  modalTitle.textContent = `Order #${order.id}`;
  modalSubtitle.textContent = `${order.customer} • ${order.date}`;

  modalBody.innerHTML = `
    <div class="detail">
      <p class="label">Customer</p>
      <p class="value">${order.customer}</p>
    </div>
    <div class="detail">
      <p class="label">Status</p>
      <p class="value">${order.status[0].toUpperCase() + order.status.slice(1)}</p>
    </div>
    <div class="detail">
      <p class="label">Date</p>
      <p class="value">${order.date}</p>
    </div>
    <div class="detail">
      <p class="label">Amount</p>
      <p class="value">${formatMoney(order.amount)}</p>
    </div>
  `;

  closeModalBtn?.focus?.();
}

function closeModal() {
  if (!modal) return;
  modal.classList.remove("open");
  modal.setAttribute("aria-hidden", "true");
  modalOrderId = null;
}

// -------- Tabs (Pages) --------
const navLinks = $$(".nav-link");
const pages = $$(".page");

function showPage(pageName) {
  pages.forEach(p => p.classList.toggle("active", p.dataset.page === pageName));
  navLinks.forEach(l => l.classList.toggle("active", l.dataset.page === pageName));
}

// -------- Events --------
// Inputs / filters
on($("#searchInput"), "input", (e) => {
  state.q = e.target.value;
  state.page = 1;
  renderAll();
});

on($("#statusFilter"), "change", (e) => {
  state.status = e.target.value;
  state.page = 1;
  renderAll();
});

on($("#sortBy"), "change", (e) => {
  state.sort = e.target.value;
  renderAll();
});

// Pagination
on($("#prevPage"), "click", () => {
  state.page -= 1;
  renderTable();
});

on($("#nextPage"), "click", () => {
  state.page += 1;
  renderTable();
});

// Table actions (View / Refund)
on($("#ordersTbody"), "click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === "view") {
    const order = orders.find(o => o.id === id);
    if (order) openModal(order);
  }

  if (action === "refund") {
    toast(`Refund started for #${id}`);
  }
});

// Export CSV
on($("#exportBtn"), "click", () => {
  const filtered = getFiltered();
  const header = ["id", "customer", "date", "amount", "status"];
  const rows = filtered.map(o => [o.id, o.customer, o.date, o.amount, o.status]);

  const csv = [header, ...rows]
    .map(r => r.map(String).map(v => `"${v.replaceAll('"', '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "orders.csv";
  a.click();
  URL.revokeObjectURL(url);

  toast("Exported CSV");
});

// Theme (both buttons)
function toggleTheme() {
  document.body.classList.toggle("light");
  drawChart();
  toast("Theme updated");
}
on($("#toggleThemeBtn"), "click", toggleTheme);
on($("#toggleThemeBtn2"), "click", toggleTheme);

// Modal events
on(closeModalBtn, "click", closeModal);
on(modalCloseBtn, "click", closeModal);

on(modal, "click", (e) => {
  if (e.target?.dataset?.close) closeModal();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal?.classList?.contains("open")) closeModal();
});

on(modalRefundBtn, "click", () => {
  if (!modalOrderId) return;
  toast(`Refund started for #${modalOrderId}`);
  closeModal();
});

// Tabs click
navLinks.forEach(link => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

// -------- Init --------
renderAll();
drawChart();
showPage("overview");
