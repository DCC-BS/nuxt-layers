// Store loggers by name for reuse
const loggers: Record<string, BrowserLogger> = {};

/**
 * Get or create a logger with the specified name
 * @param name Logger name/category
 * @returns A logger instance
 */
export function getBrowserLogger(name?: string): ILogger {
    const loggername = name ?? "default";

    const config = useAppConfig().logger;

    if (!loggers[loggername]) {
        // Create a new logger with the specified name in the context
        loggers[loggername] = new BrowserLogger({
            level: (config?.loglevel as LogLevel) ?? "info",
            defaultContext: config?.meta || [],
            includeStackTrace: config?.includeStackTrace ?? true,
            stackTraceLimit: config?.stackTraceLimit ?? 10,
        });
    }

    return loggers[loggername];
}
