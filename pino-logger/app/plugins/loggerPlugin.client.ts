import pino from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const logger = pino({
        base: { origin: "client" },
        timestamp: true,
    });

    nuxtApp.provide("logger", logger);
});
