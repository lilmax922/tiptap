// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', '@nuxtjs/tailwindcss', 'shadcn-nuxt'],

  devtools: { enabled: true },

  css: [
    '~/styles/global.css',
    '~/styles/tiptap.css',
  ],

  future: {
    compatibilityVersion: 4,
  },
  compatibilityDate: '2024-11-01',

  vite: {
    plugins: [
    ],
    optimizeDeps: {
      include: [
        'tippy.js',
      ],
    },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },
})
