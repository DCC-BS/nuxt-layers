import type { LoggerModuleOptions } from "~/src/module";
import { useRuntimeConfig } from "#imports";
import { BrowserLogger } from "#layers/logger/shared/BrowserLogger";
import type { ILogger } from "#layers/logger/shared/ILogger";

// Store loggers by name for reuse
const loggers: Record<string, BrowserLogger> = {};

/**
 * Get or create a logger with the specified name
 * @param name Logger name/category
 * @returns A logger instance
 */
export function getBrowserLogger(name?: string): ILogger {
    const loggername = name ?? "default";

    const config = useRuntimeConfig().public.logger_bs as LoggerModuleOptions;

    if (!loggers[loggername]) {
        // Create a new logger with the specified name in the context
        loggers[loggername] = new BrowserLogger({
            level: config?.loglevel ?? "info",
            defaultContext: config?.meta || [],
            includeStackTrace: config?.includeStackTrace ?? true,
            stackTraceLimit: config?.stackTraceLimit ?? 10,
        });
    }

    return loggers[loggername];
}
