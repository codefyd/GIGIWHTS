document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const searchInput = document.getElementById("searchInput");
  const statusFilter = document.getElementById("statusFilter");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const tbody = document.getElementById("conversationsTableBody");

  const contactIdFilter = window.AppUtils.getQueryParam("contact_id");

  async function loadConversations() {
    try {
      const result = await window.AppApi.getConversations({
        search: searchInput.value.trim(),
        status: statusFilter.value,
        limit: 200,
      });

      let rows = result.rows || [];

      if (contactIdFilter) {
        rows = rows.filter(row => row.contact_id === contactIdFilter);
      }

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state">لا توجد محادثات</div></td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(row => `
        <tr>
          <td>
            <div class="fw-bold">${window.AppUtils.escapeHtml(row.contact_name || "-")}</div>
            <div class="small text-muted">${window.AppUtils.escapeHtml(row.wa_id || "")}</div>
          </td>
          <td>${window.AppUtils.escapeHtml(row.phone_e164 || "-")}</td>
          <td><span class="badge ${window.AppUtils.getStatusBadgeClass(row.status)}">${window.AppUtils.escapeHtml(row.status || "-")}</span></td>
          <td>${row.unread_count ?? 0}</td>
          <td>${window.AppUtils.formatDateTime(row.last_message_at)}</td>
          <td class="text-center">
            <a href="chat.html?conversation_id=${encodeURIComponent(row.id)}" class="btn btn-sm btn-primary">فتح</a>
          </td>
        </tr>
      `).join("");
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state text-danger">تعذر تحميل المحادثات</div></td></tr>`;
    }
  }

  searchBtn?.addEventListener("click", loadConversations);

  searchInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      loadConversations();
    }
  });

  resetBtn?.addEventListener("click", () => {
    searchInput.value = "";
    statusFilter.value = "";
    window.AppUtils.setQueryParam("contact_id", "");
    loadConversations();
  });

  await loadConversations();
});
