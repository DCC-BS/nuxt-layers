import { pino, type TransportTargetOptions } from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().public.logger;

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

    const baseLogger = pino({
        base: { origin: "ssr" },
        timestamp: true,
        enabled: true,
        level: loggerConfig.loglevel as string,
        transport: {
            targets:
                process.env.NODE_ENV === "production"
                    ? productionTargets
                    : devTargets,
        },
    });

    const breadcrumbManager = useBreadcrumbs();
    const logger = createBreadcrumbAwareLogger(baseLogger, breadcrumbManager);

    nuxtApp.provide("logger", logger);
});
