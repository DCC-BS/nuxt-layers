import { pino, type Logger, type TransportTargetOptions } from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";

// Singleton: pino with `transport` spawns a worker thread on creation.
// Nuxt server plugins run per SSR request, so creating the logger inside the
// plugin leaked a logger + worker thread on every render. Create it once per
// process instead.
let baseLogger: Logger | undefined;

function getBaseLogger(loglevel: string): Logger {
    if (baseLogger) {
        return baseLogger;
    }

    const productionTargets = [
        {
            target: "pino/file",
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

    baseLogger = pino({
        base: { origin: "ssr" },
        timestamp: true,
        enabled: true,
        level: loglevel,
        transport: {
            targets:
                process.env.NODE_ENV === "production"
                    ? productionTargets
                    : devTargets,
        },
    });

    return baseLogger;
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().public.logger;

    const logger = createBreadcrumbAwareLogger(
        getBaseLogger(loggerConfig.loglevel as string),
        useBreadcrumbs(),
    );

    nuxtApp.provide("logger", logger);
});
