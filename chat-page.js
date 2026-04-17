document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage();
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const conversationIdParam = window.AppUtils.getQueryParam("conversation_id");
  const contactIdParam = window.AppUtils.getQueryParam("contact_id");

  const chatSidebarList = document.getElementById("chatSidebarList");
  const chatMessagesWrap = document.getElementById("chatMessagesWrap");
  const chatContactName = document.getElementById("chatContactName");
  const chatContactMeta = document.getElementById("chatContactMeta");
  const sidebarSearchInput = document.getElementById("sidebarSearchInput");
  const messageInput = document.getElementById("messageInput");
  const sendTextBtn = document.getElementById("sendTextBtn");
  const toggleTemplateBtn = document.getElementById("toggleTemplateBtn");
  const sendTemplateBtn = document.getElementById("sendTemplateBtn");
  const templateBox = document.getElementById("templateBox");
  const templateNameInput = document.getElementById("templateNameInput");
  const templateLanguageInput = document.getElementById("templateLanguageInput");
  const templateComponentsInput = document.getElementById("templateComponentsInput");

  let activeConversationId = conversationIdParam || null;
  let activeContactId = contactIdParam || null;
  let refreshTimer = null;

  function scrollChatToBottom() {
    chatMessagesWrap.scrollTop = chatMessagesWrap.scrollHeight;
  }

  function renderEmptyChat(text) {
    chatMessagesWrap.innerHTML = `<div class="empty-state">${window.AppUtils.escapeHtml(text)}</div>`;
  }

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

  async function loadConversationByConversationId() {
    const conversation = await window.AppApi.getConversationById(activeConversationId);
    const messages = await window.AppApi.getMessagesByConversation(activeConversationId);

    activeContactId = conversation.contact_id;

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

    await window.AppApi.markConversationAsRead(activeConversationId);
    scrollChatToBottom();
  }

  async function loadConversationByContactId() {
    if (!activeContactId) {
      renderEmptyChat("اختر محادثة من القائمة");
      return;
    }

    const contact = await window.AppApi.getContactById(activeContactId);
    chatContactName.textContent = contact.name || "جهة اتصال";
    chatContactMeta.textContent = `${contact.phone_e164 || contact.wa_id || "-"} · محادثة جديدة أو بدون سجل سابق`;

    const allConversations = await window.AppApi.getConversations({
      limit: 200,
    });

    const matched = (allConversations.rows || []).find(row => row.contact_id === activeContactId);

    if (matched) {
      activeConversationId = matched.id;
      window.AppUtils.setQueryParam("conversation_id", activeConversationId);
      await loadConversationByConversationId();
      return;
    }

    renderEmptyChat("لا توجد محادثة محفوظة بعد. يمكنك إرسال أول رسالة الآن.");
  }

  async function loadActiveConversation() {
    if (activeConversationId) {
      await loadConversationByConversationId();
      return;
    }

    if (activeContactId) {
      await loadConversationByContactId();
      return;
    }

    renderEmptyChat("اختر محادثة من القائمة");
  }

  async function refreshCurrentConversationSilently() {
    try {
      if (!activeConversationId && !activeContactId) return;
      await loadSidebar();
      await loadActiveConversation();
    } catch (error) {
      console.error("Auto refresh error:", error);
    }
  }

  async function sendText() {
    const text = messageInput.value.trim();

    if (!text) {
      Swal.fire({ icon: "warning", title: "النص مطلوب", confirmButtonText: "حسنًا" });
      return;
    }

    sendTextBtn.disabled = true;

    try {
      const payload = activeConversationId
        ? { conversation_id: activeConversationId, text }
        : { contact_id: activeContactId, text };

      const result = await window.AppApi.sendTextMessage(payload);

      if (!activeConversationId && result?.data?.conversation_id) {
        activeConversationId = result.data.conversation_id;
        window.AppUtils.setQueryParam("conversation_id", activeConversationId);
      }

      messageInput.value = "";

      await loadSidebar();
      await loadActiveConversation();

      Swal.fire({
        icon: "success",
        title: "تم الإرسال",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "فشل الإرسال",
        text: error.message || "حدث خطأ",
      });
    } finally {
      sendTextBtn.disabled = false;
    }
  }

  async function sendTemplate() {
    const templateName = templateNameInput.value.trim();
    const language = templateLanguageInput.value.trim() || "ar";

    if (!templateName) {
      Swal.fire({ icon: "warning", title: "اسم القالب مطلوب", confirmButtonText: "حسنًا" });
      return;
    }

    sendTemplateBtn.disabled = true;

    try {
      let components = [];
      const raw = templateComponentsInput.value.trim();
      if (raw) components = JSON.parse(raw);

      const payload = activeConversationId
        ? {
            conversation_id: activeConversationId,
            template_name: templateName,
            language,
            components,
          }
        : {
            contact_id: activeContactId,
            template_name: templateName,
            language,
            components,
          };

      const result = await window.AppApi.sendTemplateMessage(payload);

      if (!activeConversationId && result?.data?.conversation_id) {
        activeConversationId = result.data.conversation_id;
        window.AppUtils.setQueryParam("conversation_id", activeConversationId);
      }

      templateNameInput.value = "";
      templateComponentsInput.value = "";

      await loadSidebar();
      await loadActiveConversation();

      Swal.fire({
        icon: "success",
        title: "تم إرسال القالب",
        timer: 1000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "فشل إرسال القالب",
        text: error.message || "تحقق من Components JSON",
      });
    } finally {
      sendTemplateBtn.disabled = false;
    }
  }

  sidebarSearchInput?.addEventListener("input", loadSidebar);

  messageInput?.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  });

  sendTextBtn?.addEventListener("click", sendText);

  toggleTemplateBtn?.addEventListener("click", function () {
    templateBox.style.display = templateBox.style.display === "none" ? "flex" : "none";
  });

  sendTemplateBtn?.addEventListener("click", sendTemplate);

  await loadSidebar();
  await loadActiveConversation();

  refreshTimer = setInterval(refreshCurrentConversationSilently, 10000);

  window.addEventListener("beforeunload", function () {
    if (refreshTimer) clearInterval(refreshTimer);
  });
});
