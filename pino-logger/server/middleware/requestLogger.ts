import type { H3Event } from "h3";
import { defineEventHandler, getRequestHeader } from "h3";

/**
 * Server middleware that logs information about incoming requests
 * Logs all requests in development mode, but only failed requests in production
 *
 * @param event - The H3 event object containing request information
 */
export default defineEventHandler(async (event: H3Event): Promise<void> => {
    const method = event.node.req.method;
    const url = event.node.req.url;
    const remoteAddress = event.node.req.socket.remoteAddress;
    const userAgent = getRequestHeader(event, "user-agent");
    const loggerConfig = useAppConfig().logger as LoggerAppConfig;

    const logger = getEventLogger(event);

    const requestInfo = {
        method,
        url,
        remoteAddress,
        userAgent,
        timestamp: new Date().toISOString(),
    };

    if (loggerConfig.logAllRequests) {
        logger.info(requestInfo, "Incoming request");
        return;
    }

    event.node.res.on("finish", () => {
        const statusCode = event.node.res.statusCode;

        // Log only 4xx and 5xx responses
        if (statusCode >= 400) {
            logger.error(
                {
                    ...requestInfo,
                    statusCode,
                },
                `Failed request (${statusCode})`,
            );
        }
    });
});
