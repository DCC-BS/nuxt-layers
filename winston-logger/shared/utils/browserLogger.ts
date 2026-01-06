const levelColors = {
    error: "color: #fb2c36", // Red
    warn: "color: #ff6900", // Orange
    info: "color: #8ec5ff", // Blue
    http: "color: #1f1f1f", // Teal
    verbose: "color: #800080", // Purple
    debug: "color: #c27aff", // Gray
    silly: "color: #05df72", // Green
    help: "color: #FFC0CB",
    data: "color: #FFD700",
    prompt: "color: #C0C0C0",
    input: "color: #FFFFFF",
};

export type LogFunction = (
    message: string,
    context?: Record<string, unknown>,
) => void;
export type LogMeta = Record<string, unknown>;

export class BrowserLogger implements ILogger {
    private level: LogLevel;
    private defaultContext: unknown[];
    private includeStackTrace: boolean;
    private stackTraceLimit: number;

    /**
     * Creates a new browser-compatible logger instance
     * @param options Configuration options for the logger
     * @param options.level The log level to use for the logger
     * @param options.defaultContext Additional metadata to include in log messages
     * @param options.includeStackTrace Whether to include stack traces in log messages
     * @param options.stackTraceLimit Maximum number of stack frames to include (default: 10)
     */
    constructor(options?: {
        level?: LogLevel;
        defaultContext?: unknown[];
        includeStackTrace?: boolean;
        stackTraceLimit?: number;
    }) {
        this.level = options?.level ?? "info";
        this.defaultContext = options?.defaultContext || [];
        this.includeStackTrace = options?.includeStackTrace ?? false;
        this.stackTraceLimit = options?.stackTraceLimit ?? 10;
    }

    /**
     * Captures and formats the current stack trace
     * @returns A formatted stack trace string
     */
    private captureStackTrace(): string | undefined {
        if (!this.includeStackTrace) {
            return undefined;
        }

        try {
            // Create an Error to capture the stack trace
            const err = new Error();
            const stack = err.stack;

            if (!stack) {
                return undefined;
            }

            // Parse and clean up the stack trace
            // Split by lines, skip the first two (Error, captureStackTrace)
            // and filter out BrowserLogger methods to show only user code
            const stackLines = stack
                .split("\n")
                .slice(2) // Skip "Error" and this method
                .filter(
                    (line) =>
                        !line.includes("at BrowserLogger.") ||
                        line.includes("at BrowserLogger.log"),
                )
                .slice(1, this.stackTraceLimit + 1); // Skip the logger call itself and limit depth

            if (stackLines.length === 0) {
                return undefined;
            }

            return stackLines.map((line) => line.trim()).join("\n");
        } catch (_: unknown) {
            // Fail silently if stack trace capture fails
            return undefined;
        }
    }

    /**
     * Creates a formatted message with timestamp
     * @param level Log level
     * @param message Message content
     * @param meta Additional metadata or context
     * @returns Formatted log objects for console output
     */
    private formatLog(
        level: LogLevel,
        message: string,
        meta?: unknown[],
    ): [string, Record<string, unknown>] {
        const timestamp = new Date().toISOString();

        // Process meta arguments properly
        let context: Record<string, unknown> = {};
        if (meta && meta.length > 0) {
            // If meta contains objects, merge them
            meta.forEach((item) => {
                if (item && typeof item === "object") {
                    context = { ...context, ...item };
                }
            });
        }

        // Create a proper Record<string, unknown> to avoid type errors
        const combinedContext: Record<string, unknown> = {
            ...this.defaultContext,
        };

        // Copy all properties from context to combinedContext
        Object.keys(context).forEach((key) => {
            combinedContext[key] = context[key];
        });

        // Capture stack trace if enabled
        const stackTrace = this.captureStackTrace();
        if (stackTrace) {
            combinedContext.stackTrace = stackTrace;
        }

        // Create the formatted message part
        const formattedMessage = `[${timestamp}] [${level.toUpperCase()}]: ${message}`;

        return [formattedMessage, combinedContext];
    }

    /**
     * Log a message with the specified level
     * Supports multiple parameter variations:
     * - (level, message, ...meta)
     * - (entry: LogEntry)
     * - (level, object)
     *
     * @param levelOrEntry Log level string or LogEntry object
     * @param messageOrObject Message string or any object
     * @param meta Additional metadata
     * @returns The logger instance for chaining
     */
    public log(
        levelOrEntry: string | Record<string, unknown>,
        messageOrObject?: unknown,
        ...meta: unknown[]
    ): ILogger {
        // Handle LogEntry object case
        if (typeof levelOrEntry === "object" && levelOrEntry !== null) {
            const entry = levelOrEntry;
            const level = entry.level as string;

            const message = String(entry.message ?? "[Object]"); // NOSONAR

            if (!this.isLevelEnabled(level)) {
                return this;
            }

            // Extract metadata excluding level and message
            const { level: _, message: __, ...entryMeta } = entry;
            return this.logToConsole(level, message, [entryMeta]);
        }

        // Handle (level, message, ...meta) or (level, object) cases
        const level = levelOrEntry as string;

        if (!this.isLevelEnabled(level)) {
            return this;
        }

        // Handle object message
        if (typeof messageOrObject === "object" && messageOrObject !== null) {
            return this.logToConsole(
                level,
                JSON.stringify(messageOrObject),
                meta,
            );
        }

        // Handle string message with meta
        const message = String(messageOrObject ?? ""); // NOSONAR
        return this.logToConsole(level, message, meta);
    }

    /**
     * Internal method to perform the actual console logging
     * @param level Log level
     * @param message Message string
     * @param meta Additional metadata
     * @returns The logger instance for chaining
     */
    private logToConsole(
        level: string,
        message: string,
        meta: unknown[],
    ): ILogger {
        const [formattedMessage, combinedContext] = this.formatLog(
            level as LogLevel,
            message,
            meta,
        );

        // Empty context should not be logged
        const hasContext = Object.keys(combinedContext).length > 0;

        switch (level) {
            case "error":
                if (hasContext) {
                    console.error(
                        `%c${formattedMessage}`,
                        levelColors.error,
                        combinedContext,
                    );
                } else {
                    console.error(`%c${formattedMessage}`, levelColors.error);
                }
                break;
            case "warn":
                if (hasContext) {
                    console.warn(
                        `%c${formattedMessage}`,
                        levelColors.warn,
                        combinedContext,
                    );
                } else {
                    console.warn(`%c${formattedMessage}`, levelColors.warn);
                }

                break;
            default:
                if (hasContext) {
                    console.log(
                        `%c${formattedMessage}`,
                        levelColors[level as LogLevel] || "color: inherit",
                        combinedContext,
                    );
                } else {
                    console.log(
                        `%c${formattedMessage}`,
                        levelColors[level as LogLevel] || "color: inherit",
                    );
                }
        }

        return this;
    }

    // Simplified convenience methods for different log levels
    /**
     * Log an error message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public error(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("error", messageOrObject, ...meta);
    }

    /**
     * Log a warning message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public warn(messageOrObject: string | object, ...meta: unknown[]): ILogger {
        return this.log("warn", messageOrObject, ...meta);
    }

    /**
     * Log an info message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public info(messageOrObject: string | object, ...meta: unknown[]): ILogger {
        return this.log("info", messageOrObject, ...meta);
    }

    /**
     * Log an HTTP message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public http(messageOrObject: string | object, ...meta: unknown[]): ILogger {
        return this.log("http", messageOrObject, ...meta);
    }

    /**
     * Log a verbose message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public verbose(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("verbose", messageOrObject, ...meta);
    }

    /**
     * Log a debug message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public debug(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("debug", messageOrObject, ...meta);
    }

    /**
     * Log a silly message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public silly(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("silly", messageOrObject, ...meta);
    }

    /**
     * Log a help message
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public help(messageOrObject: string | object, ...meta: unknown[]): ILogger {
        return this.log("help", messageOrObject, ...meta);
    }

    /**
     * Log data information
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public data(messageOrObject: string | object, ...meta: unknown[]): ILogger {
        return this.log("data", messageOrObject, ...meta);
    }

    /**
     * Log prompt information
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public prompt(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("prompt", messageOrObject, ...meta);
    }

    /**
     * Log input information
     * @param messageOrObject Message content or object
     * @param meta Optional metadata
     * @returns The logger instance for chaining
     */
    public input(
        messageOrObject: string | object,
        ...meta: unknown[]
    ): ILogger {
        return this.log("input", messageOrObject, ...meta);
    }

    /**
     * Set the logging level for this logger instance
     * @param level New log level
     */
    public setLevel(level: LogLevel): void {
        this.level = level;
    }

    /**
     * Add persistent context data to all logs from this logger
     * @param context Context object to merge with all logs
     * @returns The logger instance for chaining
     */
    public addContext(context: LogMeta): this {
        this.defaultContext = { ...this.defaultContext, ...context };
        return this;
    }

    /**
     * Create a child logger with additional default context
     * @param options Additional context for the child logger
     * @returns A new logger instance with combined context
     */
    public child(options: object): this {
        return new BrowserLogger({
            level: this.level,
            defaultContext: { ...this.defaultContext, ...options },
            includeStackTrace: this.includeStackTrace,
            stackTraceLimit: this.stackTraceLimit,
        }) as this;
    }

    /**
     * Clear the logger (not applicable in browser environment)
     * @returns The logger instance for chaining
     */
    public clear(): this {
        // No-op in browser environment
        return this;
    }

    /**
     * Close the logger (not applicable in browser environment)
     * @returns The logger instance for chaining
     */
    public close(): this {
        // No-op in browser environment
        return this;
    }

    /**
     * Start a timer (not implemented in browser environment)
     * @throws NotImplementedError
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public startTimer(): any {
        throw new Error("startTimer is not implemented in browser environment");
    }

    /**
     * Profile execution time (not implemented in browser environment)
     * @throws Error
     */
    public profile(_: string | number, __?: Record<string, unknown>): this {
        throw new Error("profile is not implemented in browser environment");
    }

    /**
     * Public method to check if a log level is enabled
     * @param level The log level to check
     * @returns True if the level should be logged, false otherwise
     */
    public isLevelEnabled(level: string): boolean {
        return (
            level in logLevels &&
            logLevels[level as LogLevel] <= logLevels[this.level]
        );
    }

    /**
     * Check if error level is enabled
     * @returns True if error logs are enabled
     */
    public isErrorEnabled(): boolean {
        return this.isLevelEnabled("error");
    }

    /**
     * Check if warn level is enabled
     * @returns True if warn logs are enabled
     */
    public isWarnEnabled(): boolean {
        return this.isLevelEnabled("warn");
    }

    /**
     * Check if info level is enabled
     * @returns True if info logs are enabled
     */
    public isInfoEnabled(): boolean {
        return this.isLevelEnabled("info");
    }

    /**
     * Check if verbose level is enabled
     * @returns True if verbose logs are enabled
     */
    public isVerboseEnabled(): boolean {
        return this.isLevelEnabled("verbose");
    }

    /**
     * Check if debug level is enabled
     * @returns True if debug logs are enabled
     */
    public isDebugEnabled(): boolean {
        return this.isLevelEnabled("debug");
    }

    /**
     * Check if silly level is enabled
     * @returns True if silly logs are enabled
     */
    public isSillyEnabled(): boolean {
        return this.isLevelEnabled("silly");
    }

    /**
     * Enable stack trace in log messages
     * @param limit Optional number of stack frames to include (default: keeps current setting)
     * @returns The logger instance for chaining
     */
    public enableStackTrace(limit?: number): this {
        this.includeStackTrace = true;
        if (limit !== undefined) {
            this.stackTraceLimit = limit;
        }
        return this;
    }

    /**
     * Disable stack trace in log messages
     * @returns The logger instance for chaining
     */
    public disableStackTrace(): this {
        this.includeStackTrace = false;
        return this;
    }

    /**
     * Set the maximum number of stack frames to include in stack traces
     * @param limit Maximum number of stack frames to include
     * @returns The logger instance for chaining
     */
    public setStackTraceLimit(limit: number): this {
        this.stackTraceLimit = limit;
        return this;
    }
}
