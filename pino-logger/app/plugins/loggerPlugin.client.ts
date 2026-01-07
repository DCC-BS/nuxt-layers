import pino from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const logger = pino({
        base: { origin: "client" },
        timestamp: true,
        transport: {
            targets: [
                {
                    target: "pino-pretty",
                    level: import.meta.dev ? "trace" : "info",
                    options: {
                        colorize: true,
                    },
                },
            ],
        },
    });

    nuxtApp.provide("logger", logger);
});
