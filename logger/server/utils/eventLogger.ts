import type { BaseLogger } from "#layers/logger/shared/types/logger";
import type { H3Event } from "h3";

/**
 * Retrieves the logger from the event context or returns a new logger instance
 *
 * @param event - The H3 event object containing the context
 * @returns A Winston Logger instance
 */
export function getEventLogger(event: H3Event): BaseLogger {
    if (!event.context.logger) {
        throw new Error("Logger not found in event context");
    }
    return event.context.logger as BaseLogger;
}
