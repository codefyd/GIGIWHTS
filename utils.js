window.AppUtils = (function () {
  function isEnglishNumber(value) {
    if (value === null || value === undefined) return "";
    return String(value);
  }

  function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function formatDateTime(value) {
    if (!value) return "-";
    try {
      const date = new Date(value);
      return new Intl.DateTimeFormat(window.APP_CONFIG.DEFAULT_DATE_LOCALE || "en-GB", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return value;
    }
  }

  function formatRelativeTime(value) {
    if (!value) return "-";
    try {
      const now = new Date();
      const target = new Date(value);
      const diffMs = target.getTime() - now.getTime();
      const rtf = new Intl.RelativeTimeFormat("ar", { numeric: "auto" });

      const minutes = Math.round(diffMs / (1000 * 60));
      const hours = Math.round(diffMs / (1000 * 60 * 60));
      const days = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
      if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
      return rtf.format(days, "day");
    } catch {
      return value;
    }
  }

  function getStatusBadgeClass(status) {
    switch (status) {
      case "sent":
        return "bg-secondary";
      case "delivered":
        return "bg-info";
      case "read":
        return "bg-success";
      case "failed":
        return "bg-danger";
      case "pending":
        return "bg-warning text-dark";
      case "open":
        return "bg-success";
      case "closed":
        return "bg-secondary";
      case "archived":
        return "bg-dark";
      default:
        return "bg-light text-dark";
    }
  }

  function normalizeArray(value) {
    return Array.isArray(value) ? value : [];
  }

  function getQueryParam(key) {
    const url = new URL(window.location.href);
    return url.searchParams.get(key);
  }

  function setQueryParam(key, value) {
    const url = new URL(window.location.href);
    if (value === null || value === undefined || value === "") {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
    window.history.replaceState({}, "", url.toString());
  }

  return {
    isEnglishNumber,
    escapeHtml,
    formatDateTime,
    formatRelativeTime,
    getStatusBadgeClass,
    normalizeArray,
    getQueryParam,
    setQueryParam,
  };
})();
