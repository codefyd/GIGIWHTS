document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const tbody = document.getElementById("contactsTableBody");

  async function loadContacts() {
    try {
      const result = await window.AppApi.getContacts({
        search: searchInput.value.trim(),
      });

      const rows = result.rows || [];

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">لا توجد نتائج</div></td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(row => {
        const tags = Array.isArray(row.tags_json) ? row.tags_json : [];
        return `
          <tr>
            <td>
              <div class="fw-bold">${window.AppUtils.escapeHtml(row.name || "-")}</div>
              <div class="small text-muted">${window.AppUtils.escapeHtml(row.first_name || "")}</div>
            </td>
            <td>${window.AppUtils.escapeHtml(row.phone_e164 || row.wa_id || "-")}</td>
            <td>${tags.length ? tags.map(tag => `<span class="badge text-bg-light border me-1">${window.AppUtils.escapeHtml(tag)}</span>`).join("") : "-"}</td>
            <td>${window.AppUtils.formatDateTime(row.last_message_at)}</td>
            <td class="text-center">
              <a href="conversations.html?contact_id=${encodeURIComponent(row.id)}" class="btn btn-sm btn-outline-primary">المحادثات</a>
            </td>
          </tr>
        `;
      }).join("");
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state text-danger">تعذر تحميل البيانات</div></td></tr>`;
    }
  }

  searchBtn?.addEventListener("click", loadContacts);
  resetBtn?.addEventListener("click", () => {
    searchInput.value = "";
    loadContacts();
  });

  await loadContacts();
});
