export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie("authToken");

  if (to.path.startsWith("/admin/") && to.path !== "/admin/login") {
    if (!authToken.value) {
      return navigateTo("/admin/login");
    }
  } else if (to.path === "/admin/login") {
    if (authToken.value) {
      return navigateTo("/admin/dashboard");
    }
  }
});
