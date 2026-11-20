import { pino } from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { createServerPinoOptions } from "#layers/pino-logger/shared/utils/pinoOptions";
import { getEventBreadcrumbManager } from "../utils/breadcrumbStorage";
import { resolveRequestId } from "../utils/requestId";

export default defineNitroPlugin((nitroApp) => {
    const loggerConfig = useRuntimeConfig().public.logger;

    const baseLogger = pino(
        createServerPinoOptions({
            logger: "api",
            app: loggerConfig.app as string | undefined,
            level: loggerConfig.loglevel as string,
            includeStackTrace: loggerConfig.includeStackTrace as boolean,
            production: !import.meta.dev,
        }),
    );

    nitroApp.hooks.hook("request", (event) => {
        const requestId = resolveRequestId(event);
        event.context.requestId = requestId;

        const breadcrumbManager = getEventBreadcrumbManager(event);
        const logger = createBreadcrumbAwareLogger(
            baseLogger.child({ request_id: requestId }),
            breadcrumbManager,
        );
        event.context.logger = logger;
    });

    baseLogger.info("pino logger initialized");
});
