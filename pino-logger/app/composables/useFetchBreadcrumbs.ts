import { useBreadcrumbs } from "#layers/pino-logger/app/composables/useBreadcrumbs";

export function useFetchBreadcrumbs(): void {
    const breadcrumbManager = useBreadcrumbs();
    const config = breadcrumbManager.getConfig();

    if (!config.enabled || !config.autoCollect.xhr) {
        return;
    }

    const originalFetch = window.fetch.bind(window);

    window.fetch = Object.assign(
        async (input: RequestInfo | URL, init?: RequestInit) => {
            let url: string;
            let method: string;

            if (input instanceof Request) {
                url = input.url;
                method = input.method ?? "GET";
            } else if (input instanceof URL) {
                url = input.toString();
                method = init?.method ?? "GET";
            } else {
                url = input;
                method = init?.method ?? "GET";
            }

            breadcrumbManager.addBreadcrumb({
                type: "http",
                category: "http",
                level: "info",
                message: `HTTP Request: ${method} ${url}`,
                data: {
                    url,
                    method,
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
                        method,
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
                        method,
                        error:
                            error instanceof Error
                                ? error.message
                                : String(error),
                    },
                });

                throw error;
            }
        },
        originalFetch,
    );
}
