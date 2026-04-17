document.addEventListener("DOMContentLoaded", async function () {
  await window.PageGuards.protectPage({ allowRoles: ["owner", "admin"] });
  document.getElementById("logoutBtn")?.addEventListener("click", () => window.PageGuards.logoutWithConfirm());

  const accountsWrap = document.getElementById("accountsWrap");
  const phoneNumbersWrap = document.getElementById("phoneNumbersWrap");
  const settingsWrap = document.getElementById("settingsWrap");
  const defaultPhoneNumberInput = document.getElementById("defaultPhoneNumberInput");
  const systemNameInput = document.getElementById("systemNameInput");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");

  async function loadPageData() {
    try {
      const [accounts, phoneNumbers, settings] = await Promise.all([
        window.AppApi.getWhatsAppAccounts(),
        window.AppApi.getWhatsAppPhoneNumbers(),
        window.AppApi.getAppSettings(),
      ]);

      accountsWrap.innerHTML = accounts.length ? accounts.map(row => `
        <div class="border rounded-3 p-3 mb-2">
          <div class="fw-bold">${window.AppUtils.escapeHtml(row.business_name || "-")}</div>
          <div class="small text-muted">WABA ID: ${window.AppUtils.escapeHtml(row.waba_id || "-")}</div>
          <div class="mt-1"><span class="badge ${window.AppUtils.getStatusBadgeClass(row.status)}">${window.AppUtils.escapeHtml(row.status || "-")}</span></div>
        </div>
      `).join("") : `<div class="text-muted">لا توجد حسابات</div>`;

      phoneNumbersWrap.innerHTML = phoneNumbers.length ? phoneNumbers.map(row => `
        <div class="border rounded-3 p-3 mb-2">
          <div class="fw-bold">${window.AppUtils.escapeHtml(row.display_phone_number || "-")}</div>
          <div class="small text-muted">phone_number_id: ${window.AppUtils.escapeHtml(row.phone_number_id || "-")}</div>
          <div class="small text-muted">verified_name: ${window.AppUtils.escapeHtml(row.verified_name || "-")}</div>
          <div class="mt-1">
            ${row.is_default ? '<span class="badge bg-primary">default</span>' : ''}
            <span class="badge ${window.AppUtils.getStatusBadgeClass(row.status)}">${window.AppUtils.escapeHtml(row.status || "-")}</span>
          </div>
        </div>
      `).join("") : `<div class="text-muted">لا توجد أرقام</div>`;

      settingsWrap.innerHTML = settings.length ? settings.map(row => `
        <div class="border rounded-3 p-3 mb-2">
          <div class="fw-bold">${window.AppUtils.escapeHtml(row.setting_key || "-")}</div>
          <div class="small text-muted mb-2">${window.AppUtils.escapeHtml(row.description || "")}</div>
          <pre class="json-box mb-0">${JSON.stringify(row.setting_value, null, 2)}</pre>
        </div>
      `).join("") : `<div class="text-muted">لا توجد إعدادات محفوظة</div>`;

      const defaultPhoneSetting = settings.find(x => x.setting_key === "default_phone_number_id");
      const systemNameSetting = settings.find(x => x.setting_key === "system_name");

      if (defaultPhoneSetting) defaultPhoneNumberInput.value = defaultPhoneSetting.setting_value?.value || "";
      if (systemNameSetting) systemNameInput.value = systemNameSetting.setting_value?.value || "";
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "تعذر تحميل الإعدادات",
        text: error.message || "حدث خطأ",
      });
    }
  }

  saveSettingsBtn?.addEventListener("click", async function () {
    saveSettingsBtn.disabled = true;

    try {
      await window.AppApi.upsertAppSetting(
        "default_phone_number_id",
        { value: defaultPhoneNumberInput.value.trim() || null },
        "رقم الإرسال الافتراضي"
      );

      await window.AppApi.upsertAppSetting(
        "system_name",
        { value: systemNameInput.value.trim() || "لوحة واتساب أعمال" },
        "اسم النظام"
      );

      await loadPageData();

      Swal.fire({
        icon: "success",
        title: "تم الحفظ",
        text: "تم تحديث الإعدادات بنجاح",
        confirmButtonText: "حسنًا",
      });
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "فشل الحفظ",
        text: error.message || "حدث خطأ",
      });
    } finally {
      saveSettingsBtn.disabled = false;
    }
  });

  await loadPageData();
});
