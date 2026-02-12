import { BreadcrumbManager } from "#layers/pino-logger/shared/utils/breadcrumbManager";

export function useBreadcrumbs(): BreadcrumbManager {
    const nuxtApp = useNuxtApp();

    if (nuxtApp.$breadcrumbManager) {
        return nuxtApp.$breadcrumbManager as BreadcrumbManager;
    }

    const config = useRuntimeConfig().public.logger.breadcrumbs;
    const manager = new BreadcrumbManager(config);

    nuxtApp.$breadcrumbManager = manager;

    return manager;
}

declare module "#app" {
    interface NuxtApp {
        $breadcrumbManager?: BreadcrumbManager;
    }
}
