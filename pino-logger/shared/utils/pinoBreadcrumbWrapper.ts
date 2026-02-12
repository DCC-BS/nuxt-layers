import type pino from "pino";
import type {
    Breadcrumb,
    BreadcrumbLevel,
} from "#layers/logger/shared/types/breadcrumb";
import type {
    BaseLogger,
    LogFn,
    LogLevel,
} from "#layers/logger/shared/types/logger";
import type { BreadcrumbManager } from "./breadcrumbManager";

const LOG_LEVELS = [
    "fatal",
    "error",
    "warn",
    "info",
    "debug",
    "trace",
] as const;

type LogLevelKey = (typeof LOG_LEVELS)[number];

function mapPinoLevelToBreadcrumbLevel(level: LogLevelKey): BreadcrumbLevel {
    const levelMap: Record<LogLevelKey, BreadcrumbLevel> = {
        fatal: "fatal",
        error: "error",
        warn: "warning",
        info: "info",
        debug: "debug",
        trace: "debug",
    };
    return levelMap[level] || "info";
}

class BreadcrumbAwareLogger implements BaseLogger {
    constructor(
        private readonly pinoLogger: pino.Logger,
        private readonly breadcrumbManager: BreadcrumbManager,
    ) {}

    get level(): LogLevel {
        return this.pinoLogger.level as LogLevel;
    }

    set level(value: LogLevel) {
        this.pinoLogger.level = value;
    }

    logWithBreadcrumb(level: LogLevelKey, ...args: unknown[]): void {
        // last argument is the message if it's a string, otherwise undefined
        const message =
            args.length > 0 && typeof args[args.length - 1] === "string"
                ? (args[args.length - 1] as string)
                : undefined;

        // first argument is the data if it's an object, otherwise undefined
        const data =
            args.length > 1 && typeof args[0] === "object"
                ? args[0]
                : undefined;

        this.breadcrumbManager.addBreadcrumb({
            category: "log",
            level: mapPinoLevelToBreadcrumbLevel(level),
            message: message as string | undefined,
            data: data as Record<string, unknown> | undefined,
        });

        // Include breadcrumbs in the log data
        const logData = {
            breadcrumbs: this.breadcrumbManager.getBreadcrumbs(),
            ...(data || {}),
        };

        if (message) {
            this.pinoLogger[level](logData, message);
        } else {
            this.pinoLogger[level](logData);
        }
    }

    fatal: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("fatal", ...args);
    };

    error: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("error", ...args);
    };

    warn: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("warn", ...args);
    };

    info: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("info", ...args);
    };

    debug: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("debug", ...args);
    };

    trace: LogFn = (...args: unknown[]): void => {
        this.logWithBreadcrumb("trace", ...args);
    };

    silent: LogFn = (..._args: unknown[]): void => {
        // Silent: do nothing
    };

    addBreadcrumb(breadcrumb: Partial<Breadcrumb>, hint?: unknown): void {
        this.breadcrumbManager.addBreadcrumb(breadcrumb, hint);
    }

    clearBreadcrumbs(): void {
        this.breadcrumbManager.clear();
    }

    getBreadcrumbs(): readonly Breadcrumb[] {
        return this.breadcrumbManager.getBreadcrumbs();
    }

    configureBreadcrumbs(
        config: Partial<Parameters<BreadcrumbManager["updateConfig"]>[0]>,
    ): void {
        this.breadcrumbManager.updateConfig(config);
    }
}

export function createBreadcrumbAwareLogger(
    baseLogger: pino.Logger,
    breadcrumbManager: BreadcrumbManager,
): BaseLogger {
    return new BreadcrumbAwareLogger(baseLogger, breadcrumbManager);
}
