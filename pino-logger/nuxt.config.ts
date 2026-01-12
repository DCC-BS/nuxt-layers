// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    $meta: {
        name: "pino-logger",
    },
    devtools: { enabled: true },
    vite: {
        optimizeDeps: {
            include: ["pino"],
        },
    },
    runtimeConfig: {
        logger: {
            loglevel: "info",
            includeStackTrace: true,
            stackTraceLimit: 5,
            logAllRequests: false,
        },
    },
});
