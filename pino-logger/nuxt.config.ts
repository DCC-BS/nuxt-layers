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
        public: {
            logger: {
                loglevel: (process.env.NODE_ENV === "production"
                    ? "warn"
                    : "debug") as LogLevel,
                includeStackTrace: true,
                stackTraceLimit: 5,
                logAllRequests: false,
            },
        },
    },
});
