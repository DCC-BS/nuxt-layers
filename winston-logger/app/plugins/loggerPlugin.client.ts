import { defineNuxtPlugin } from "#app";

export default defineNuxtPlugin(async (nuxtApp) => {
    const logger = (
        await import("../services/browserLoggerFactory")
    ).getBrowserLogger();
    nuxtApp.provide("logger", logger);
});
