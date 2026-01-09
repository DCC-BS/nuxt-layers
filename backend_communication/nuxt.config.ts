// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "backend_communication",
    },
    devtools: { enabled: true },
    runtimeConfig: {
        apiUrl: process.env.API_URL,
    }
})
