import { pino, type TransportTargetOptions } from "pino";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().logger;

    const productionTargets = [
        {
            target: "pino/file",
            level: "warn",
            options: { destination: 1 },
        },
    ] as TransportTargetOptions[];

    const devTargets = [
        {
            target: "pino-pretty",
            level: "trace",
            options: {
                colorize: false,
            },
        },
    ] as TransportTargetOptions[];

    const logger = pino({
        base: { origin: "ssr" },
        timestamp: true,
        enabled: true,
        level: loggerConfig.loglevel,
        transport: {
            targets:
                process.env.NODE_ENV === "production"
                    ? productionTargets
                    : devTargets,
        },
    });

    nuxtApp.provide("logger", logger);
});
