import type { H3Event } from "h3";
import { BreadcrumbManager } from "#layers/pino-logger/shared/utils/breadcrumbManager";

export function getEventBreadcrumbManager(event: H3Event): BreadcrumbManager {
    if (event.context.breadcrumbManager) {
        return event.context.breadcrumbManager as BreadcrumbManager;
    }

    const config = useRuntimeConfig().public.logger.breadcrumbs;
    const manager = new BreadcrumbManager(config);

    event.context.breadcrumbManager = manager;
    return manager;
}
