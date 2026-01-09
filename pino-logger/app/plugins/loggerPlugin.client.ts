import pino from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useAppConfig().logger as LoggerAppConfig;

    const logger = pino({
        base: { origin: "client" },
        level: loggerConfig.loglevel,
        timestamp: true,
    });

    nuxtApp.provide("logger", logger);
});
