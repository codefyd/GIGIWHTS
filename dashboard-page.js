document.addEventListener("DOMContentLoaded", async function () {
  const countsEls = {
    conversations: document.getElementById("kpiConversations"),
    contacts: document.getElementById("kpiContacts"),
    messagesToday: document.getElementById("kpiMessagesToday"),
    unreadMessages: document.getElementById("kpiUnreadMessages"),
  };

  const latestMessagesWrap = document.getElementById("latestMessages");
  const latestWebhooksWrap = document.getElementById("latestWebhooks");
  const latestActivitiesWrap = document.getElementById("latestActivities");
  const currentUserName = document.getElementById("currentUserName");
  const logoutBtn = document.getElementById("logoutBtn");

  const authBundle = await window.PageGuards.protectPage();
  if (!authBundle) return;

  if (currentUserName) {
    currentUserName.textContent = authBundle.profile?.full_name || authBundle.user?.email || "مستخدم";
  }

  if (logoutBtn) {
    logoutBtn.addEventListener("click", function () {
      window.PageGuards.logoutWithConfirm();
    });
  }

  try {
    const result = await window.AppApi.getDashboardStats();
    const data = result.data || {};
    const counts = data.counts || {};

    if (countsEls.conversations) countsEls.conversations.textContent = counts.conversations ?? 0;
    if (countsEls.contacts) countsEls.contacts.textContent = counts.contacts ?? 0;
    if (countsEls.messagesToday) countsEls.messagesToday.textContent = counts.messages_today ?? 0;
    if (countsEls.unreadMessages) countsEls.unreadMessages.textContent = counts.unread_messages ?? 0;

    if (latestMessagesWrap) {
      const rows = data.latest_messages || [];
      latestMessagesWrap.innerHTML = rows.length
        ? rows.map(row => `
            <div class="border rounded-3 p-3 mb-2">
              <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <strong>${window.AppUtils.escapeHtml(row.contacts?.name || "-")}</strong>
                <span class="badge ${window.AppUtils.getStatusBadgeClass(row.status)}">${window.AppUtils.escapeHtml(row.status || "-")}</span>
              </div>
              <div class="small text-muted mt-1">${window.AppUtils.formatDateTime(row.created_at)}</div>
              <div class="mt-2">${window.AppUtils.escapeHtml(row.content_text || `[${row.message_type || "message"}]`)}</div>
            </div>
          `).join("")
        : '<div class="text-muted">لا توجد رسائل حديثة</div>';
    }

    if (latestWebhooksWrap) {
      const rows = data.latest_webhooks || [];
      latestWebhooksWrap.innerHTML = rows.length
        ? rows.map(row => `
            <div class="border rounded-3 p-3 mb-2">
              <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <strong>${window.AppUtils.escapeHtml(row.source || "-")}</strong>
                <span class="badge ${row.processed ? "bg-success" : "bg-warning text-dark"}">
                  ${row.processed ? "processed" : "pending"}
                </span>
              </div>
              <div class="small text-muted mt-1">${window.AppUtils.formatDateTime(row.received_at)}</div>
            </div>
          `).join("")
        : '<div class="text-muted">لا توجد Webhooks حديثة</div>';
    }

    if (latestActivitiesWrap) {
      const rows = data.latest_activities || [];
      latestActivitiesWrap.innerHTML = rows.length
        ? rows.map(row => `
            <div class="border rounded-3 p-3 mb-2">
              <div class="d-flex justify-content-between align-items-center gap-2 flex-wrap">
                <strong>${window.AppUtils.escapeHtml(row.action || "-")}</strong>
                <span class="text-muted small">${window.AppUtils.escapeHtml(row.entity_type || "-")}</span>
              </div>
              <div class="small text-muted mt-1">${window.AppUtils.formatDateTime(row.created_at)}</div>
            </div>
          `).join("")
        : '<div class="text-muted">لا يوجد نشاط حديث</div>';
    }
  } catch (error) {
    console.error(error);
    Swal.fire({
      icon: "error",
      title: "تعذر تحميل اللوحة",
      text: error.message || "حدث خطأ أثناء تحميل البيانات",
      confirmButtonText: "حسنًا",
    });
  }
});
