import type { Breadcrumb, BreadcrumbConfig } from "./breadcrumb";

export type LogLevel =
    | "silent"
    | "fatal"
    | "error"
    | "warn"
    | "info"
    | "debug"
    | "trace";

export interface LogFn {
    (msg: string): void;
    (obj: unknown, msg?: string): void;
}

export interface BaseLogger {
    /**
     * Set this property to the desired logging level. In order of priority, available levels are:
     *
     * - 'fatal'
     * - 'error'
     * - 'warn'
     * - 'info'
     * - 'debug'
     * - 'trace'
     *
     * The logging level is a __minimum__ level. For instance if `logger.level` is `'info'` then all `'fatal'`, `'error'`, `'warn'`,
     * and `'info'` logs will be enabled.
     *
     * You can pass `'silent'` to disable logging.
     */
    level: LogLevel;

    /**
     * Log at `'fatal'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    fatal: LogFn;
    /**
     * Log at `'error'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    error: LogFn;
    /**
     * Log at `'warn'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    warn: LogFn;
    /**
     * Log at `'info'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    info: LogFn;
    /**
     * Log at `'debug'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    debug: LogFn;
    /**
     * Log at `'trace'` level the given msg. If the first argument is an object, all its properties will be included in the JSON line.
     * If more args follows `msg`, these will be used to format `msg` using `util.format`.
     *
     * @param obj: object to be serialized
     * @param msg: the log message to write
     */
    trace: LogFn;
    /**
     * Noop function.
     */
    silent: LogFn;

    /**
     * Add a breadcrumb to the current scope
     *
     * @param breadcrumb - Partial breadcrumb object (timestamp auto-set if not provided)
     * @param hint - Optional context for beforeBreadcrumb filter
     */
    addBreadcrumb(breadcrumb: Partial<Breadcrumb>, hint?: unknown): void;

    /**
     * Clear all breadcrumbs from the current scope
     */
    clearBreadcrumbs(): void;

    /**
     * Get all breadcrumbs in the current scope
     *
     * @returns Readonly array of breadcrumbs (oldest first)
     */
    getBreadcrumbs(): readonly Breadcrumb[];

    /**
     * Update breadcrumb configuration
     *
     * @param config - Partial config object to merge with existing config
     */
    configureBreadcrumbs(config: Partial<BreadcrumbConfig>): void;
}
