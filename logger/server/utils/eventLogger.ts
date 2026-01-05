import type { H3Event } from "h3";
import type { ILogger } from "../../app/types/logger";

/**
 * Retrieves the logger from the event context or returns a new logger instance
 *
 * @param event - The H3 event object containing the context
 * @returns A Winston Logger instance
 */
export function getEventLogger(event: H3Event): ILogger {
    return event.context.logger as ILogger;
}
