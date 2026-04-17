window.AppApi = (function () {
  const client = window.supabaseClient;
  const { FUNCTIONS_BASE_URL } = window.APP_CONFIG || {};

  function ensureClient() {
    if (!client) throw new Error("Supabase client is not initialized");
  }

  async function getAccessToken() {
    const token = await window.AuthService.getAccessToken();
    if (!token) throw new Error("لم يتم العثور على جلسة تسجيل دخول");
    return token;
  }

  async function callFunction(functionName, method = "POST", body = null) {
    const accessToken = await getAccessToken();

    const response = await fetch(`${FUNCTIONS_BASE_URL}/${functionName}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data?.ok === false) {
      throw new Error(data?.error || "حدث خطأ أثناء تنفيذ الطلب");
    }

    return data;
  }

  async function selectProfile() {
    ensureClient();
    const user = await window.AuthService.getUser();
    if (!user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function getDashboardStats() {
    return await callFunction("get-dashboard-stats", "GET");
  }

  async function getContacts(params = {}) {
    ensureClient();

    const {
      search = "",
      limit = 50,
      page = 1,
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client
      .from("contacts")
      .select("*", { count: "exact" })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone_e164.ilike.%${search}%,wa_id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      rows: data || [],
      count: count || 0,
      page,
      limit,
    };
  }

  async function getContactById(contactId) {
    ensureClient();

    const { data, error } = await client
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .single();

    if (error) throw error;
    return data;
  }

  async function updateContact(contactId, payload) {
    ensureClient();

    const { data, error } = await client
      .from("contacts")
      .update({
        name: payload.name,
        first_name: payload.first_name,
        tags_json: Array.isArray(payload.tags_json) ? payload.tags_json : [],
        notes: payload.notes || null,
        opt_in_status: payload.opt_in_status || "unknown",
      })
      .eq("id", contactId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function getConversations(params = {}) {
    ensureClient();

    const {
      search = "",
      status = "",
      limit = 50,
      page = 1,
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client
      .from("v_conversation_list")
      .select("*", { count: "exact" })
      .order("last_message_at", { ascending: false, nullsFirst: false })
      .range(from, to);

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(`contact_name.ilike.%${search}%,phone_e164.ilike.%${search}%,wa_id.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      rows: data || [],
      count: count || 0,
      page,
      limit,
    };
  }

  async function getConversationById(conversationId) {
    ensureClient();

    const { data, error } = await client
      .from("v_conversation_list")
      .select("*")
      .eq("id", conversationId)
      .single();

    if (error) throw error;
    return data;
  }

  async function getMessagesByConversation(conversationId, limit = 100) {
    ensureClient();

    const { data, error } = await client
      .from("v_message_list")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async function markConversationAsRead(conversationId) {
    ensureClient();

    const { data, error } = await client
      .from("conversations")
      .update({
        unread_count: 0,
      })
      .eq("id", conversationId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function sendTextMessage(payload) {
    return await callFunction("send-text-message", "POST", payload);
  }

  async function sendTemplateMessage(payload) {
    return await callFunction("send-template-message", "POST", payload);
  }

  async function getTemplates(params = {}) {
    ensureClient();

    const {
      search = "",
      status = "",
      language = "",
      limit = 100,
      page = 1,
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client
      .from("whatsapp_templates")
      .select("*", { count: "exact" })
      .order("updated_at", { ascending: false })
      .range(from, to);

    if (status) query = query.eq("status", status);
    if (language) query = query.eq("language", language);

    if (search) {
      query = query.or(`name.ilike.%${search}%,category.ilike.%${search}%,language.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      rows: data || [],
      count: count || 0,
      page,
      limit,
    };
  }

  async function syncTemplates(wabaId = "") {
    return await callFunction("sync-whatsapp-templates", "POST", {
      waba_id: wabaId || null,
    });
  }

  async function getWebhookLogs(params = {}) {
    ensureClient();

    const {
      limit = 50,
      page = 1,
      processed = "",
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = client
      .from("webhook_logs")
      .select("*", { count: "exact" })
      .order("received_at", { ascending: false })
      .range(from, to);

    if (processed === "true") query = query.eq("processed", true);
    if (processed === "false") query = query.eq("processed", false);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      rows: data || [],
      count: count || 0,
      page,
      limit,
    };
  }

  async function getWebhookLogById(id) {
    ensureClient();

    const { data, error } = await client
      .from("webhook_logs")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  async function getAuditLogs(params = {}) {
    ensureClient();

    const {
      limit = 50,
      page = 1,
    } = params;

    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await client
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    return {
      rows: data || [],
      count: count || 0,
      page,
      limit,
    };
  }

  async function getWhatsAppAccounts() {
    ensureClient();

    const { data, error } = await client
      .from("whatsapp_accounts")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function getWhatsAppPhoneNumbers() {
    ensureClient();

    const { data, error } = await client
      .from("whatsapp_phone_numbers")
      .select(`
        *,
        whatsapp_accounts (
          id,
          business_name,
          waba_id,
          status
        )
      `)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async function getAppSettings() {
    ensureClient();

    const { data, error } = await client
      .from("app_settings")
      .select("*")
      .order("setting_key", { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async function upsertAppSetting(settingKey, settingValue, description = "") {
    ensureClient();

    const { data, error } = await client
      .from("app_settings")
      .upsert({
        setting_key: settingKey,
        setting_value: settingValue,
        description: description || null,
      }, {
        onConflict: "setting_key",
      })
      .select("*")
      .single();

    if (error) throw error;
    return data;
  }

  async function getCurrentUserBundle() {
    const [user, profile] = await Promise.all([
      window.AuthService.getUser(),
      selectProfile(),
    ]);

    return {
      user,
      profile,
    };
  }

  return {
    selectProfile,
    getCurrentUserBundle,
    getDashboardStats,
    getContacts,
    getContactById,
    updateContact,
    getConversations,
    getConversationById,
    getMessagesByConversation,
    markConversationAsRead,
    sendTextMessage,
    sendTemplateMessage,
    getTemplates,
    syncTemplates,
    getWebhookLogs,
    getWebhookLogById,
    getAuditLogs,
    getWhatsAppAccounts,
    getWhatsAppPhoneNumbers,
    getAppSettings,
    upsertAppSetting,
  };
})();
