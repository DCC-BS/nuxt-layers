import type { H3Event } from "h3";
import { defineEventHandler } from "h3";
import { getEventBreadcrumbManager } from "../utils/breadcrumbStorage";
import { getLogThrottler } from "../utils/logThrottleStorage";

export default defineEventHandler(async (event: H3Event): Promise<void> => {
    const startedAt = performance.now();
    const method = event.node.req.method;
    // Path without query string: query parameters can carry personal data.
    const path = (event.node.req.url ?? "").split("?")[0];
    const loggerConfig = useRuntimeConfig().public.logger;

    const logger = getEventLogger(event);
    const breadcrumbManager = getEventBreadcrumbManager(event);
    const logThrottler = getLogThrottler();

    if (
        loggerConfig.breadcrumbs?.enabled &&
        loggerConfig.breadcrumbs.autoCollect.xhr
    ) {
        breadcrumbManager.addBreadcrumb({
            category: "http",
            type: "http",
            message: `${method} ${path}`,
            level: "info",
            data: {
                method,
                path,
            },
        });
    }

    event.node.res.on("finish", () => {
        const statusCode = event.node.res.statusCode;
        const requestInfo = {
            event: "request_finished",
            method,
            path,
            status_code: statusCode,
            duration_s: Number(
                ((performance.now() - startedAt) / 1000).toFixed(4),
            ),
        };

        if (statusCode < 400) {
            if (loggerConfig.logAllRequests) {
                logger.info(requestInfo, `${method} ${path} ${statusCode}`);
            }
            return;
        }

        const throttleResult = logThrottler.check(
            `${method} ${path} ${statusCode}`,
        );

        if (throttleResult.summary) {
            logger.warn(
                {
                    key: throttleResult.summary.key,
                    suppressedCount: throttleResult.summary.suppressedCount,
                    windowMs: throttleResult.summary.windowMs,
                },
                `Suppressed ${throttleResult.summary.suppressedCount} repeated error(s) for ${throttleResult.summary.key} in last ${throttleResult.summary.windowMs}ms`,
            );
        }

        if (!throttleResult.allow) {
            return;
        }

        if (
            loggerConfig.breadcrumbs?.enabled &&
            loggerConfig.breadcrumbs.autoCollect.xhr
        ) {
            breadcrumbManager.addBreadcrumb({
                category: "http",
                type: "http",
                message: `Failed request (${statusCode})`,
                level: "error",
                data: {
                    method,
                    path,
                    statusCode,
                },
            });
        }

        logger.error(requestInfo, `Failed request (${statusCode})`);
    });
});
