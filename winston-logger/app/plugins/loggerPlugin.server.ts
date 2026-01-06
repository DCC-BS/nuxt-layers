import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(async (nuxtApp) => {
    const { getWinstonLogger } = await import(
        "../../shared/utils/winstonLogger.server"
    );
    const logger = getWinstonLogger();
    nuxtApp.provide("logger", logger);
});
