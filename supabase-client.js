(function () {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = window.APP_CONFIG || {};

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("APP_CONFIG is missing SUPABASE_URL or SUPABASE_ANON_KEY");
    window.supabaseClient = null;
    return;
  }

  if (!window.supabase || !window.supabase.createClient) {
    console.error("Supabase JS library is not loaded");
    window.supabaseClient = null;
    return;
  }

  window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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
