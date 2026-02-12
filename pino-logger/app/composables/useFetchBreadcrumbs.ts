import { useBreadcrumbs } from "#layers/pino-logger/app/composables/useBreadcrumbs";

export function useFetchBreadcrumbs(): void {
    const breadcrumbManager = useBreadcrumbs();
    const config = breadcrumbManager.getConfig();

    if (!config.enabled || !config.autoCollect.xhr) {
        return;
    }

    const originalFetch = window.fetch;

    window.fetch = async (input, init) => {
        const url = typeof input === "string" ? input : (input as Request).url;

        breadcrumbManager.addBreadcrumb({
            type: "http",
            category: "http",
            level: "info",
            message: `HTTP Request: ${(input as Request).method || "GET"} ${url}`,
            data: {
                url,
                method: (input as Request).method || "GET",
            },
        });

        try {
            const response = await originalFetch(input, init);

            breadcrumbManager.addBreadcrumb({
                type: "http",
                category: "http",
                level: "info",
                message: `HTTP Response: ${response.status} ${url}`,
                data: {
                    url,
                    method: (input as Request).method || "GET",
                    status: response.status,
                },
            });

            return response;
        } catch (error: unknown) {
            breadcrumbManager.addBreadcrumb({
                type: "http",
                category: "http",
                level: "error",
                message: `HTTP Error: ${url}`,
                data: {
                    url,
                    method: (input as Request).method || "GET",
                    error:
                        error instanceof Error ? error.message : String(error),
                },
            });

            throw error;
        }
    };
}
