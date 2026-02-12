import pino from "pino";
import { createBreadcrumbAwareLogger } from "#layers/pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { useBreadcrumbs } from "../composables/useBreadcrumbs";

export default defineNuxtPlugin(async (nuxtApp) => {
    const loggerConfig = useRuntimeConfig().public.logger;

    const baseLogger = pino({
        base: { origin: "client" },
        level: loggerConfig.loglevel as string,
        timestamp: true,
    });

    const breadcrumbManager = useBreadcrumbs();
    const logger = createBreadcrumbAwareLogger(baseLogger, breadcrumbManager);

    nuxtApp.provide("logger", logger);
});
