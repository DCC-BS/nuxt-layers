import { useBreadcrumbs } from "#layers/pino-logger/app/composables/useBreadcrumbs";

export function useNavigationBreadcrumbs(): void {
    const breadcrumbManager = useBreadcrumbs();
    const config = breadcrumbManager.getConfig();

    if (!config.enabled || !config.autoCollect.navigation) {
        return;
    }

    const router = useRouter();

    router.afterEach((to, from) => {
        breadcrumbManager.addBreadcrumb({
            type: "navigation",
            category: "navigation",
            level: "info",
            message: `Navigation: ${from.fullPath} → ${to.fullPath}`,
        });
    });
}
