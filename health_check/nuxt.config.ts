// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "health_check",
    },
    runtimeConfig: {
        apiUrl: process.env.API_URL || "http://localhost:3000",
    },
    devtools: { enabled: true },
});
