window.PageGuards = (function () {
  async function protectPage(options = {}) {
    try {
      const authBundle = await window.AuthService.requireAuth(options);
      return authBundle;
    } catch (error) {
      console.error(error);
      if (window.Swal) {
        await Swal.fire({
          icon: "error",
          title: "تعذر فتح الصفحة",
          text: error.message || "حدث خطأ غير متوقع",
          confirmButtonText: "حسنًا",
        });
      }
      window.location.href = "login.html";
      return null;
    }
  }

  async function logoutWithConfirm() {
    const proceed = await (window.Swal
      ? Swal.fire({
          icon: "question",
          title: "تسجيل الخروج",
          text: "هل تريد تسجيل الخروج من النظام؟",
          showCancelButton: true,
          confirmButtonText: "نعم",
          cancelButtonText: "إلغاء",
        })
      : Promise.resolve({ isConfirmed: true }));

    if (!proceed.isConfirmed) return;

    await window.AuthService.signOut();
    window.location.href = "login.html";
  }

  return {
    protectPage,
    logoutWithConfirm,
  };
})();
