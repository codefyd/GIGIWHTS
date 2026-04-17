document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const conversationId = window.AppUtils.getQueryParam("conversation_id");
  const chatSidebarList = document.getElementById("chatSidebarList");
  const chatMessagesWrap = document.getElementById("chatMessagesWrap");
  const chatContactName = document.getElementById("chatContactName");
  const chatContactMeta = document.getElementById("chatContactMeta");
  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  const messageInput = document.getElementById("messageInput");
  const sendTextBtn = document.getElementById("sendTextBtn");
  const sendTemplateBtn = document.getElementById("sendTemplateBtn");
  const templateBox = document.getElementById("templateBox");
  const templateNameInput = document.getElementById("templateNameInput");
  const templateLanguageInput = document.getElementById("templateLanguageInput");
  const templateComponentsInput = document.getElementById("templateComponentsInput");

  let activeConversationId = conversationId || null;

  async function loadSidebar() {
    const result = await window.AppApi.getConversations({
      search: sidebarSearchInput.value.trim(),
      limit: 100,
    });

    const rows = result.rows || [];

    chatSidebarList.innerHTML = rows.length ? rows.map(row => `
      <a class="chat-list-item ${row.id === activeConversationId ? "active" : ""}" href="chat.html?conversation_id=${encodeURIComponent(row.id)}">
        <div class="d-flex justify-content-between align-items-center gap-2">
          <div class="chat-list-name">${window.AppUtils.escapeHtml(row.contact_name || "-")}</div>
          ${row.unread_count > 0 ? `<span class="badge text-bg-danger">${row.unread_count}</span>` : ""}
        </div>
        <div class="chat-list-meta">${window.AppUtils.escapeHtml(row.phone_e164 || "-")}</div>
        <div class="chat-list-meta">${window.AppUtils.formatDateTime(row.last_message_at)}</div>
      </a>
    `).join("") : `<div class="empty-state">لا توجد محادثات</div>`;
  }

  async function loadConversation() {
    if (!activeConversationId) {
      chatMessagesWrap.innerHTML = `<div class="empty-state">اختر محادثة من القائمة</div>`;
      return;
    }

    const conversation = await window.AppApi.getConversationById(activeConversationId);
    const messages = await window.AppApi.getMessagesByConversation(activeConversationId);

    chatContactName.textContent = conversation.contact_name || "جهة اتصال";
    chatContactMeta.textContent = `${conversation.phone_e164 || "-"} · ${conversation.status || "-"}`;

    chatMessagesWrap.innerHTML = messages.length ? messages.map(msg => `
      <div class="chat-message-row ${msg.direction}">
        <div class="chat-bubble">
          <div class="chat-bubble-text">${window.AppUtils.escapeHtml(msg.content_text || `[${msg.message_type || "message"}]`)}</div>
          <div class="chat-bubble-meta">
            <span>${window.AppUtils.formatDateTime(msg.created_at)}</span>
            <span class="badge ${window.AppUtils.getStatusBadgeClass(msg.status)}">${window.AppUtils.escapeHtml(msg.status || "-")}</span>
          </div>
        </div>
      </div>
    `).join("") : `<div class="empty-state">لا توجد رسائل في هذه المحادثة</div>`;

    chatMessagesWrap.scrollTop = chatMessagesWrap.scrollHeight;
    await window.AppApi.markConversationAsRead(activeConversationId);
  }

  sendTextBtn?.addEventListener("click", async function () {
    if (!activeConversationId) return;

    const text = messageInput.value.trim();
    if (!text) {
      Swal.fire({ icon: "warning", title: "النص مطلوب", confirmButtonText: "حسنًا" });
      return;
    }

    sendTextBtn.disabled = true;

    try {
      await window.AppApi.sendTextMessage({
        conversation_id: activeConversationId,
        text,
      });

      messageInput.value = "";
      await loadConversation();
      await loadSidebar();

      Swal.fire({
        icon: "success",
        title: "تم الإرسال",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({ icon: "error", title: "فشل الإرسال", text: error.message || "حدث خطأ" });
    } finally {
      sendTextBtn.disabled = false;
    }
  });

  sendTemplateBtn?.addEventListener("click", async function () {
    if (!activeConversationId) return;

    templateBox.style.display = templateBox.style.display === "none" ? "flex" : "none";

    if (templateBox.style.display !== "none" && templateNameInput.value.trim()) {
      try {
        let components = [];
        const raw = templateComponentsInput.value.trim();
        if (raw) components = JSON.parse(raw);

        await window.AppApi.sendTemplateMessage({
          conversation_id: activeConversationId,
          template_name: templateNameInput.value.trim(),
          language: templateLanguageInput.value.trim() || "ar",
          components,
        });

        templateNameInput.value = "";
        templateComponentsInput.value = "";
        await loadConversation();
        await loadSidebar();

        Swal.fire({
          icon: "success",
          title: "تم إرسال القالب",
          timer: 1200,
          showConfirmButton: false,
        });
      } catch (error) {
        console.error(error);
        Swal.fire({ icon: "error", title: "فشل إرسال القالب", text: error.message || "تحقق من البيانات" });
      }
    }
  });

  sidebarSearchInput?.addEventListener("input", loadSidebar);

  await loadSidebar();
  await loadConversation();
});
