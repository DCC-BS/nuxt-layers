import { type Logger, pino } from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { createServerPinoOptions } from "#layers/pino-logger/shared/utils/pinoOptions";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";

// Singleton: pino with `transport` spawns a worker thread on creation.
// Nuxt server plugins run per SSR request, so creating the logger inside the
// plugin leaked a logger + worker thread on every render. Create it once per
// process instead.
let baseLogger: Logger | undefined;

function getBaseLogger(
    loggerConfig: ReturnType<typeof useRuntimeConfig>["public"]["logger"],
): Logger {
    if (baseLogger) {
        return baseLogger;
    }

    baseLogger = pino(
        createServerPinoOptions({
            logger: "ssr",
            app: loggerConfig.app as string | undefined,
            level: loggerConfig.loglevel as string,
            includeStackTrace: loggerConfig.includeStackTrace as boolean,
            production: process.env.NODE_ENV === "production",
        }),
    );

    return baseLogger;
}

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().public.logger;

    // `requestId` is set per request by server/plugins/pinoPlugin.ts.
    const requestId = useRequestEvent()?.context.requestId;
    const base = getBaseLogger(loggerConfig);

    const logger = createBreadcrumbAwareLogger(
        typeof requestId === "string"
            ? base.child({ request_id: requestId })
            : base,
        useBreadcrumbs(),
    );

    nuxtApp.provide("logger", logger);
});
