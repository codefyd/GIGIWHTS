window.AuthService = (function () {
  const client = window.supabaseClient;

  async function signIn(email, password) {
    if (!client) throw new Error("Supabase client is not initialized");

    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function signOut() {
    if (!client) throw new Error("Supabase client is not initialized");

    const { error } = await client.auth.signOut();
    if (error) throw error;
    return true;
  }

  async function getSession() {
    if (!client) throw new Error("Supabase client is not initialized");

    const { data, error } = await client.auth.getSession();
    if (error) throw error;
    return data.session || null;
  }

  async function getUser() {
    if (!client) throw new Error("Supabase client is not initialized");

    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user || null;
  }

  async function getProfile() {
    const user = await getUser();
    if (!user) return null;

    const { data, error } = await client
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async function requireAuth(options = {}) {
    const {
      redirectTo = "login.html",
      allowRoles = [],
    } = options;

    const session = await getSession();
    if (!session) {
      window.location.href = redirectTo;
      return null;
    }

    const profile = await getProfile();
    if (!profile || !profile.is_active) {
      await signOut();
      window.location.href = redirectTo;
      return null;
    }

    if (Array.isArray(allowRoles) && allowRoles.length > 0) {
      if (!allowRoles.includes(profile.role)) {
        throw new Error("ليس لديك صلاحية للوصول إلى هذه الصفحة");
      }
    }

    return {
      session,
      user: session.user,
      profile,
    };
  }

  async function getAccessToken() {
    const session = await getSession();
    return session?.access_token || null;
  }

  return {
    signIn,
    signOut,
    getSession,
    getUser,
    getProfile,
    requireAuth,
    getAccessToken,
  };
})();
