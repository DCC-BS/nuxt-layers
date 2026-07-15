import { pino, type TransportTargetOptions } from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { getEventBreadcrumbManager } from "../utils/breadcrumbStorage";

export default defineNitroPlugin((nitroApp) => {
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
            options: {
                colorize: false,
            },
        },
    ] as TransportTargetOptions[];

    const baseLogger = pino({
        base: { origin: "api" },
        level: loggerConfig.loglevel as string,
        timestamp: true,
        transport: {
            targets: import.meta.dev ? devTargets : productionTargets,
        },
    });

    nitroApp.hooks.hook("request", (event) => {
        const breadcrumbManager = getEventBreadcrumbManager(event);
        const logger = createBreadcrumbAwareLogger(
            baseLogger,
            breadcrumbManager,
        );
        event.context.logger = logger;
    });

    baseLogger.info("pino logger initialized");
});
