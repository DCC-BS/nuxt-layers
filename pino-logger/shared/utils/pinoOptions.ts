import type { LoggerOptions } from "pino";

/**
 * Pino options shared by the two server-side loggers (the SSR singleton in
 * `app/plugins/loggerPlugin.server.ts` and the Nitro logger in
 * `server/plugins/pinoPlugin.ts`), so their output cannot drift apart.
 *
 * In production every line follows the DCC-BS log contract
 * (https://dcc-bs.github.io/documentation/coding/logging):
 * `timestamp` (ISO UTC), `level` (debug|info|warning|error|critical),
 * `message`, `app`, `logger`, errors as `error` / `error_type` / `exception`
 * strings, and custom fields as flat scalars.
 * In development the pino-pretty transport is used unchanged.
 */

export type ServerLoggerName = "ssr" | "api";

export interface ServerPinoOptionsInput {
    /** Value of the `logger` field: "ssr" or "api". */
    logger: ServerLoggerName;
    /** Value of the `app` field; omitted from the output when empty. */
    app?: string;
    /** Minimum pino level ("trace" ... "fatal", or "silent"). */
    level: string;
    /** Write the stack of a logged Error to `exception`. */
    includeStackTrace?: boolean;
    /** true: contract JSON on stdout. false: pino-pretty. */
    production: boolean;
}

const CONTRACT_LEVELS: Record<string, string> = {
    trace: "debug",
    debug: "debug",
    info: "info",
    warn: "warning",
    error: "error",
    fatal: "critical",
};

const ERROR_KEYS = new Set(["err", "error"]);

function contractTimestamp(): string {
    return `,"timestamp":"${new Date().toISOString()}"`;
}

function contractLevel(label: string): Record<string, string> {
    return { level: CONTRACT_LEVELS[label] ?? label };
}

function stringifyValue(value: object): string {
    // Logging must never throw: an invalid Date throws in toISOString().
    try {
        if (value instanceof Date) {
            return value.toISOString();
        }
        return JSON.stringify(value) ?? String(value);
    } catch {
        return String(value);
    }
}

/**
 * Turns the object passed to a log call into contract fields:
 * - an Error under `err` or `error` (the first one found) becomes
 *   `error` (message), `error_type` (name) and `exception` (stack);
 *   these three fields are written last, so other keys can't overwrite
 *   them; any other Error value becomes a "Name: message" string,
 * - nested objects and arrays become JSON strings,
 * - scalars pass through unchanged.
 */
export function toContractLogFields(
    obj: Record<string, unknown>,
    includeStackTrace = true,
): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    let loggedError: Error | undefined;

    for (const [key, value] of Object.entries(obj)) {
        if (value instanceof Error) {
            if (ERROR_KEYS.has(key) && !loggedError) {
                loggedError = value;
            } else {
                out[key] = `${value.name}: ${value.message}`;
            }
            continue;
        }

        out[key] =
            value !== null && typeof value === "object"
                ? stringifyValue(value)
                : value;
    }

    if (loggedError) {
        out.error = loggedError.message;
        out.error_type = loggedError.name;
        if (includeStackTrace && loggedError.stack) {
            out.exception = loggedError.stack;
        } else {
            delete out.exception;
        }
    }

    return out;
}

export function createServerPinoOptions(
    input: ServerPinoOptionsInput,
): LoggerOptions {
    if (!input.production) {
        return {
            base: { logger: input.logger },
            level: input.level,
            timestamp: true,
            transport: {
                targets: [
                    {
                        target: "pino-pretty",
                        level: "trace",
                        options: { colorize: false },
                    },
                ],
            },
        };
    }

    const includeStackTrace = input.includeStackTrace ?? true;

    // No transport in production: pino writes straight to stdout. (Custom
    // level formatters are not allowed with `transport.targets` anyway.)
    return {
        base: input.app
            ? { app: input.app, logger: input.logger }
            : { logger: input.logger },
        level: input.level,
        messageKey: "message",
        timestamp: contractTimestamp,
        formatters: {
            level: contractLevel,
            log: (obj) => toContractLogFields(obj, includeStackTrace),
        },
    };
}
