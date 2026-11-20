import type { BreadcrumbConfig } from "./breadcrumb";
import type { ErrorThrottleConfig } from "./errorThrottle";
import type { LogLevel } from "./logger";

export type LoggerAppConfig = {
    /** Value of the `app` field in server log lines (log contract). */
    app: string;
    loglevel: LogLevel;
    meta: [];
    includeStackTrace: boolean;
    stackTraceLimit: number;
    logAllRequests: boolean;
    breadcrumbs: BreadcrumbConfig;
    errorThrottle: ErrorThrottleConfig;
};
