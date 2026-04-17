document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const searchInput = document.getElementById("searchInput");
  const statusInput = document.getElementById("statusInput");
  const languageInput = document.getElementById("languageInput");
  const searchBtn = document.getElementById("searchBtn");
  const syncTemplatesBtn = document.getElementById("syncTemplatesBtn");
  const tbody = document.getElementById("templatesTableBody");

  async function loadTemplates() {
    try {
      const result = await window.AppApi.getTemplates({
        search: searchInput.value.trim(),
        status: statusInput.value.trim(),
        language: languageInput.value.trim(),
      });

      const rows = result.rows || [];

      if (!rows.length) {
        tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state">لا توجد قوالب</div></td></tr>`;
        return;
      }

      tbody.innerHTML = rows.map(row => `
        <tr>
          <td class="fw-bold">${window.AppUtils.escapeHtml(row.name || "-")}</td>
          <td>${window.AppUtils.escapeHtml(row.language || "-")}</td>
          <td>${window.AppUtils.escapeHtml(row.category || "-")}</td>
          <td><span class="badge ${window.AppUtils.getStatusBadgeClass(row.status)}">${window.AppUtils.escapeHtml(row.status || "-")}</span></td>
          <td>${window.AppUtils.formatDateTime(row.last_synced_at || row.updated_at)}</td>
        </tr>
      `).join("");
    } catch (error) {
      console.error(error);
      tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state text-danger">تعذر تحميل القوالب</div></td></tr>`;
    }
  }

  searchBtn?.addEventListener("click", loadTemplates);

  syncTemplatesBtn?.addEventListener("click", async function () {
    syncTemplatesBtn.disabled = true;
    try {
      const result = await window.AppApi.syncTemplates();
      await loadTemplates();

      Swal.fire({
        icon: "success",
        title: "تمت المزامنة",
        text: `تمت مزامنة ${result?.data?.synced_count ?? 0} قالب`,
        confirmButtonText: "حسنًا",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "فشل المزامنة", text: error.message || "حدث خطأ" });
    } finally {
      syncTemplatesBtn.disabled = false;
    }
  });

  await loadTemplates();
});
