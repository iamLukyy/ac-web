export default defineNuxtConfig({
  modules: [
    '@nuxt/ui',
    '@nuxt/eslint'
  ],

  css: ['~/assets/css/main.css'],

  app: {
    head: {
      title: 'AC Web',
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }
      ]
    }
  },

  devtools: { enabled: true },

  compatibilityDate: '2025-01-15',

  runtimeConfig: {
    // Server-only config — override via NUXT_ env vars
    // e.g. NUXT_ADMIN_PASSWORD, NUXT_DATA_PATH, etc.
    adminPassword: process.env.NUXT_ADMIN_PASSWORD || 'changeme',
    sessionSecret: process.env.NUXT_SESSION_SECRET || 'change-this-to-a-random-string',
    dataPath: process.env.NUXT_DATA_PATH || './data',
    dockerComposePath: process.env.NUXT_DOCKER_COMPOSE_PATH || '.',
    acServerUrl: process.env.NUXT_AC_SERVER_URL || 'http://127.0.0.1:8081'
  },

  nitro: {
    experimental: {
      tasks: true
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
