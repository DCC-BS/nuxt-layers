import type { H3Event } from "h3";
import { defineEventHandler, getRequestHeader } from "h3";
import { getEventBreadcrumbManager } from "../utils/breadcrumbStorage";

export default defineEventHandler(async (event: H3Event): Promise<void> => {
    const method = event.node.req.method;
    const url = event.node.req.url;
    const remoteAddress = event.node.req.socket.remoteAddress;
    const userAgent = getRequestHeader(event, "user-agent");
    const loggerConfig = useRuntimeConfig().public.logger;

    const logger = getEventLogger(event);
    const breadcrumbManager = getEventBreadcrumbManager(event);

    const requestInfo = {
        method,
        url,
        remoteAddress,
        userAgent,
        timestamp: new Date().toISOString(),
    };

    if (loggerConfig.breadcrumbs?.enabled && loggerConfig.breadcrumbs.autoCollect.xhr) {
        breadcrumbManager.addBreadcrumb({
            category: "http",
            type: "http",
            message: `${method} ${url}`,
            level: "info",
            data: {
                method,
                url,
                remoteAddress,
                userAgent,
            },
        });
    }

    if (loggerConfig.logAllRequests) {
        logger.info(requestInfo, "Incoming request");
        return;
    }

    event.node.res.on("finish", () => {
        const statusCode = event.node.res.statusCode;

        if (statusCode >= 400) {
            breadcrumbManager.addBreadcrumb({
                category: "http",
                type: "http",
                message: `Failed request (${statusCode})`,
                level: "error",
                data: {
                    method,
                    url,
                    statusCode,
                },
            });

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
