import { H3Event, deleteCookie } from "h3";

export default defineEventHandler(async (event) => {
  try {
    // 1. Clear the authentication cookie
    // This assumes your authentication token is stored in a cookie named 'auth_token'
    // The deleteCookie function effectively clears the cookie by setting its expiration to a past date
    deleteCookie(event, "auth_token", {
      // Ensure these match the options used when setting the cookie for proper deletion
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict", // Must match the SameSite attribute used when setting the cookie
      path: "/", // The path for which the cookie is valid, must match the set cookie path
    });

    // 2. Return a success response
    setResponseStatus(event, 200); // OK
    return {
      success: true,
      message: "Logout successful.",
    };
  } catch (error) {
    // 3. Handle any errors during the process
    console.error("Logout error:", error);
    setResponseStatus(event, 500); // Internal Server Error
    return {
      success: false,
      message: "An unexpected error occurred during logout.",
      error: (error as Error).message, // Provide error message for debugging
    };
  }
});
