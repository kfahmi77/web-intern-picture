// https://nuxt.com/docs/api/configuration/nuxt-config
import { fileURLToPath } from 'node:url'

const appManifestPath = fileURLToPath(new URL('./.nuxt/manifest/meta/dev.json', import.meta.url))

export default defineNuxtConfig({
  compatibilityDate: '2025-06-05',
  devtools: { enabled: false },
  vite: {
    resolve: {
      alias: {
        '#app-manifest': appManifestPath,
      },
    },
  },
  app: {
    head: {
      title: 'Sampai Jumpa, Anak Magang',
      htmlAttrs: { lang: 'id' },
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Kolase kenang-kenangan anak magang.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,900&family=DM+Sans:wght@400;500;600&display=swap',
        },
      ],
    },
  },
  runtimeConfig: {
    adminPassword: '',
    minio: {
      endPoint: '',
      port: '',
      useSSL: '',
      accessKey: '',
      secretKey: '',
      bucket: '',
    },
    dbPath: '',
  },
  nitro: {
    storage: {},
  },
})
