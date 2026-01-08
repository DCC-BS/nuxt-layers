// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    vite: {
        optimizeDeps: {
            include: ["pino"],
        },
        resolve: {
            alias: {
                // ensure nothing imports pino/browser.js directly
                "pino/browser.js": "pino",
                "pino/browser": "pino",
            },
        },
    },
});
