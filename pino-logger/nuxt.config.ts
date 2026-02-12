// https://nuxt.com/docs/api/configuration/nuxt-config

import type { BreadcrumbConfig } from "#layers/logger/shared/types/breadcrumb";
import type { LogLevel } from "#layers/logger/shared/types/logger";

export default defineNuxtConfig({
    $meta: {
        name: "pino-logger",
    },
    devtools: { enabled: true },
    vite: {
        optimizeDeps: {
            include: ["pino"],
        },
    },
    runtimeConfig: {
        public: {
            logger: {
                loglevel: (process.env.NODE_ENV === "production"
                    ? "warn"
                    : "debug") satisfies LogLevel,
                includeStackTrace: true,
                stackTraceLimit: 5,
                logAllRequests: false,
                breadcrumbs: {
                    maxBreadcrumbs: 50,
                    enabled: true,
                    autoCollect: {
                        navigation: true,
                        xhr: true,
                    },
                } satisfies BreadcrumbConfig,
            },
        },
    },
});
