(function () {
  window.APP_CONFIG = {
    SUPABASE_URL: "https://xbhsdweqlaksnchmjcwj.supabase.co",
    SUPABASE_PUBLISHABLE_KEY: "sb_publishable_-R45ldtmLq-hLXKWeuZ5cg_GHzFZ6UM",
    FUNCTIONS_BASE_URL: "https://xbhsdweqlaksnchmjcwj.supabase.co/functions/v1",
    APP_NAME: "لوحة واتساب أعمال",
    APP_VERSION: "1.0.0",
    DEFAULT_LANGUAGE: "ar",
    DEFAULT_DIRECTION: "rtl",
    DEFAULT_DATE_LOCALE: "en-GB",
  };

  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = window.APP_CONFIG || {};

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    console.error("APP_CONFIG is missing SUPABASE_URL or SUPABASE_PUBLISHABLE_KEY");
    window.supabaseClient = null;
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS library is not loaded");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        "X-Client-Info": "whatsapp-dashboard-web",
      },
    },
  });
})();
