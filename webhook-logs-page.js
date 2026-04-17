document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const processedFilter = document.getElementById("processedFilter");
  const filterBtn = document.getElementById("filterBtn");
  const webhookLogsList = document.getElementById("webhookLogsList");
  const webhookLogMeta = document.getElementById("webhookLogMeta");
  const webhookLogPayload = document.getElementById("webhookLogPayload");

  async function showDetails(id) {
    try {
      const row = await window.AppApi.getWebhookLogById(id);
      webhookLogMeta.innerHTML = `
        <div><strong>المصدر:</strong> ${window.AppUtils.escapeHtml(row.source || "-")}</div>
        <div><strong>وقت الوصول:</strong> ${window.AppUtils.formatDateTime(row.received_at)}</div>
        <div><strong>المعالجة:</strong> ${row.processed ? "processed" : "pending"}</div>
      `;
      webhookLogPayload.textContent = JSON.stringify(row.payload_json || {}, null, 2);
    } catch (error) {
      console.error(error);
      webhookLogMeta.textContent = "تعذر تحميل التفاصيل";
      webhookLogPayload.textContent = "{}";
    }
  }

  async function loadWebhookLogs() {
    try {
      const result = await window.AppApi.getWebhookLogs({
        processed: processedFilter.value,
      });

      const rows = result.rows || [];

      if (!rows.length) {
        webhookLogsList.innerHTML = `<div class="empty-state">لا توجد سجلات</div>`;
        webhookLogMeta.textContent = "اختر سجلًا من القائمة";
        webhookLogPayload.textContent = "{}";
        return;
      }

      webhookLogsList.innerHTML = rows.map(row => `
        <button class="w-100 text-end border rounded-3 p-3 mb-2 bg-white webhook-log-item"
          data-id="${row.id}">
          <div class="d-flex justify-content-between align-items-center gap-2">
            <strong>${window.AppUtils.escapeHtml(row.source || "-")}</strong>
            <span class="badge ${row.processed ? "bg-success" : "bg-warning text-dark"}">${row.processed ? "processed" : "pending"}</span>
          </div>
          <div class="small text-muted mt-1">${window.AppUtils.formatDateTime(row.received_at)}</div>
        </button>
      `).join("");

      document.querySelectorAll(".webhook-log-item").forEach(btn => {
        btn.addEventListener("click", function () {
          showDetails(this.dataset.id);
        });
      });

      await showDetails(rows[0].id);
    } catch (error) {
      console.error(error);
      webhookLogsList.innerHTML = `<div class="empty-state text-danger">تعذر تحميل السجلات</div>`;
    }
  }

  filterBtn?.addEventListener("click", loadWebhookLogs);

  await loadWebhookLogs();
});
