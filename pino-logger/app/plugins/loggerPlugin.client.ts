import * as pinoModule from 'pino'

const pino = pinoModule.default || pinoModule

export default defineNuxtPlugin(async (nuxtApp) => {
    const logger = pino({
        base: { origin: "client" },
        timestamp: true,
        browser: {
            asObject: true, // recommended in browser.[web:9]
        },
    });

    nuxtApp.provide("logger", logger);
});
