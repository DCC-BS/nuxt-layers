import { AsyncLocalStorage } from "node:async_hooks";
import type { H3Event } from "h3";
import { BreadcrumbManager } from "#layers/pino-logger/shared/utils/breadcrumbManager";

const requestStorage = new AsyncLocalStorage<BreadcrumbManager>();

export function getEventBreadcrumbManager(event: H3Event): BreadcrumbManager {
    if (event.context.breadcrumbManager) {
        return event.context.breadcrumbManager as BreadcrumbManager;
    }

    let manager = requestStorage.getStore();
    if (!manager) {
        const config = useRuntimeConfig().public.logger.breadcrumbs;
        manager = new BreadcrumbManager(config);
        requestStorage.enterWith(manager);
    }

    event.context.breadcrumbManager = manager;
    return manager;
}
