// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-25',
  devtools: { enabled: true },
  modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxtjs/tailwindcss', 'nuxt-security', '@prisma/nuxt'],
  fonts: {
    families: [
      {
        name: 'Poppins',
        provider: 'google',
        weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900']
      },
    ]
  },
  vite: {
    resolve: {
      alias: {
        '.prisma/client/index-browser': './node_modules/.prisma/client/index-browser.js',
      },
    },
  },
})