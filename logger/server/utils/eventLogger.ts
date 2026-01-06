import type { H3Event } from "h3";

/**
 * Retrieves the logger from the event context or returns a new logger instance
 *
 * @param event - The H3 event object containing the context
 * @returns A Winston Logger instance
 */
export function getEventLogger(event: H3Event): ILogger {
    if (!event.context.logger) {
        throw new Error("Logger not found in event context");
    }
    return event.context.logger as ILogger;
}
