import { H3Event, deleteCookie } from "h3";

export default defineEventHandler(async (event) => {
  try {
    deleteCookie(event, "authToken", { path: "/admin/" });

    setResponseStatus(event, 200);
    return {
      success: true,
      message: "Logout successful.",
    };
  } catch (error) {
    console.error("Logout error:", error);
    setResponseStatus(event, 500);
    return {
      success: false,
      message: "An unexpected error occurred during logout.",
      error: (error as Error).message,
    };
  }
});
