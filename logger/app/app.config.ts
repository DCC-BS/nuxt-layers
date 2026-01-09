export default defineAppConfig({
    logger: {
        loglevel: "trace" as LogLevel,
        meta: [] as unknown[],
        includeStackTrace: false,
        stackTraceLimit: 5,
        logAllRequests: false,
    } as LoggerAppConfig,
});
