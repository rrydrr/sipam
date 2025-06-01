import { jwtDecode } from "jwt-decode"; // Import jwt-decode
// Removed: import jwt from "jsonwebtoken";

export default defineNuxtRouteMiddleware((to, from) => {
  const authToken = useCookie<string | null>("authToken"); // Specify type for clarity

  // Helper function to check if the token is expired or malformed
  const isTokenExpiredOrInvalid = (
    tokenValue: string | null | undefined
  ): boolean => {
    if (!tokenValue) {
      return true; // No token is treated as invalid for this purpose
    }
    try {
      const decodedToken: { exp: number } = jwtDecode(tokenValue);
      // Check if 'exp' claim exists and if the token is expired
      // Date.now() is in milliseconds, decodedToken.exp is in seconds
      if (decodedToken.exp && decodedToken.exp * 1000 < Date.now()) {
        return true; // Token is expired
      }
      return false; // Token is not expired
    } catch (error: any) {
      // This can happen if the token is malformed or not a JWT
      console.warn("Middleware: Error decoding token - ", error.message);
      return true; // Treat as invalid/expired
    }
  };

  // Allow navigation if coming from the login page (user just attempted/logged in)
  if (from.path === "/admin/login") {
    return;
  }

  // Logic for accessing admin routes (but not the login page itself)
  if (to.path.startsWith("/admin/") && to.path !== "/admin/login") {
    if (isTokenExpiredOrInvalid(authToken.value)) {
      if (authToken.value) {
        // If there was a token, but it's bad/expired
        console.log(
          "Middleware: Token expired or invalid while accessing admin area. Clearing token."
        );
        authToken.value = null; // Clear the problematic token
      }
      return navigateTo("/admin/login"); // Redirect to login
    }
    // Token exists and is not (client-side checked as) expired/invalid, allow navigation
  }

  // Logic for being on the login page when a token already exists
  if (to.path === "/admin/login" && authToken.value) {
    if (isTokenExpiredOrInvalid(authToken.value)) {
      // Token is bad/expired, clear it and let the user stay on the login page
      console.log(
        "Middleware: On login page, token expired or invalid. Clearing token."
      );
      authToken.value = null;
    } else {
      // Token exists and is not (client-side checked as) expired/invalid, redirect to dashboard
      return navigateTo("/admin/dashboard");
    }
  }

  // No specific conditions met, allow navigation
  return;
});
