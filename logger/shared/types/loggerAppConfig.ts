import type { LogLevel } from "./logger";
import type { BreadcrumbConfig } from "./breadcrumb";

export type LoggerAppConfig = {
    loglevel: LogLevel;
    meta: [];
    includeStackTrace: boolean;
    stackTraceLimit: number;
    logAllRequests: boolean;
    breadcrumbs: BreadcrumbConfig;
};
