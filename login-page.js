document.addEventListener("DOMContentLoaded", async function () {
  const loginForm = document.getElementById("loginForm");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const submitBtn = document.getElementById("submitBtn");

  try {
    const session = await window.AuthService.getSession();
    if (session) {
      window.location.href = "dashboard.html";
      return;
    }
  } catch (error) {
    console.error(error);
  }

  if (!loginForm) return;

  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = emailInput?.value?.trim() || "";
    const password = passwordInput?.value || "";

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "بيانات ناقصة",
        text: "أدخل البريد الإلكتروني وكلمة المرور",
        confirmButtonText: "حسنًا",
      });
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm ms-1"></span> جارٍ الدخول...';

    try {
      await window.AuthService.signIn(email, password);

      Swal.fire({
        icon: "success",
        title: "تم تسجيل الدخول",
        text: "جاري تحويلك إلى اللوحة الرئيسية",
        timer: 1200,
        showConfirmButton: false,
      });

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 1200);
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "فشل تسجيل الدخول",
        text: error.message || "تحقق من بيانات الدخول",
        confirmButtonText: "حسنًا",
      });
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
});
