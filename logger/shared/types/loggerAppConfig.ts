import type { BreadcrumbConfig } from "./breadcrumb";
import type { ErrorThrottleConfig } from "./errorThrottle";
import type { LogLevel } from "./logger";

export type LoggerAppConfig = {
    loglevel: LogLevel;
    meta: [];
    includeStackTrace: boolean;
    stackTraceLimit: number;
    logAllRequests: boolean;
    breadcrumbs: BreadcrumbConfig;
    errorThrottle: ErrorThrottleConfig;
};
