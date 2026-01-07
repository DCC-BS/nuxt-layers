import { pino } from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useAppConfig().logger as LoggerAppConfig;
    const logger = pino({
        base: { origin: "client" },
        timestamp: true,
        level: loggerConfig.loglevel,
        browser: { asObject: true }
    });

    nuxtApp.provide("logger", logger);
});
