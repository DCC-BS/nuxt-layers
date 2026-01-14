// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "backend_communication",
    },
    extends: ["github:DCC-BS/nuxt-layers/logger"],
    devtools: { enabled: true },
    runtimeConfig: {
        apiUrl: process.env.API_URL,
        useDummyData: process.env.DUMMY || "",
    },
});
