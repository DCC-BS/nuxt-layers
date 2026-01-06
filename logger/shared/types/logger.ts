// Define log levels with their priorities
export const logLevels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
    help: 7,
    data: 8,
    prompt: 9,
    input: 10,
};

export type LogLevel = keyof typeof logLevels;

interface Profiler {
    logger: ILogger;
    start: number;
    done(info?: unknown): boolean;
}

interface LogEntry {
    level: string;
    message: string;
    [optionName: string]: unknown;
}

interface LeveledLogMethod {
    (message: string, ...meta: unknown[]): ILogger;
    (message: string): ILogger;
    (infoObject: object): ILogger;
}

interface LogMethod {
    (level: string, message: string, ...meta: unknown[]): ILogger;
    (entry: LogEntry): ILogger;
    (level: string, message: unknown): ILogger;
}

export interface ILogger {
    log: LogMethod;
    clear(): this;
    close(): this;

    // for cli and npm levels
    error: LeveledLogMethod;
    warn: LeveledLogMethod;
    help: LeveledLogMethod;
    data: LeveledLogMethod;
    info: LeveledLogMethod;
    debug: LeveledLogMethod;
    prompt: LeveledLogMethod;
    http: LeveledLogMethod;
    verbose: LeveledLogMethod;
    input: LeveledLogMethod;
    silly: LeveledLogMethod;

    startTimer(): Profiler;
    profile(id: string | number, meta?: Record<string, unknown>): this;

    child(options: object): this;

    isLevelEnabled(level: string): boolean;
    isErrorEnabled(): boolean;
    isWarnEnabled(): boolean;
    isInfoEnabled(): boolean;
    isVerboseEnabled(): boolean;
    isDebugEnabled(): boolean;
    isSillyEnabled(): boolean;
}
