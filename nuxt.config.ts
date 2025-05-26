// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-05-25",
  devtools: { enabled: true },
  modules: [
    "@nuxt/eslint",
    "@nuxt/fonts",
    "@nuxtjs/tailwindcss",
    "nuxt-security",
    "@prisma/nuxt",
  ],
  fonts: {
    families: [
      {
        name: "Poppins",
        provider: "google",
        weights: [
          "100",
          "200",
          "300",
          "400",
          "500",
          "600",
          "700",
          "800",
          "900",
        ],
      },
    ],
  },
  vite: {
    resolve: {
      alias: {
        ".prisma/client/index-browser":
          "./node_modules/.prisma/client/index-browser.js",
      },
    },
  },
  security: {
    rateLimiter: {
      tokensPerInterval: 100,
      interval: 300000, // 5 minutes
    },
    csrf: {
      enabled: process.env.NODE_ENV === "production",
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      },
      headerName: "x-csrf-token",
    },
  },
});
