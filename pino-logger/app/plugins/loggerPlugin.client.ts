import pino from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().logger;

    const logger = pino({
        base: { origin: "client" },
        level: loggerConfig.loglevel,
        timestamp: true,
    });

    nuxtApp.provide("logger", logger);
});
