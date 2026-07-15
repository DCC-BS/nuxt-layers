export interface Breadcrumb {
    /**
     * Unix timestamp in seconds (auto-set if not provided)
     */
    timestamp?: number;

    /**
     * Type of breadcrumb - influences display/UI
     * @default "default"
     */
    type?: BreadcrumbType;

    /**
     * Dotted string for categorization (e.g., "ui.click", "xhr", "auth")
     */
    category?: string;

    /**
     * Human-readable message describing the breadcrumb
     */
    message?: string;

    /**
     * Severity level of the breadcrumb
     * @default "info"
     */
    level?: BreadcrumbLevel;

    /**
     * Arbitrary data associated with this breadcrumb
     */
    data?: Record<string, unknown>;

    /**
     * Source identifier for the breadcrumb
     */
    origin?: string;
}

export type BreadcrumbType =
    | "default"
    | "debug"
    | "error"
    | "navigation"
    | "http"
    | "info"
    | "query"
    | "transaction"
    | "ui"
    | "user";

export type BreadcrumbLevel = "fatal" | "error" | "warning" | "info" | "debug";

export interface BreadcrumbConfig {
    /**
     * Maximum number of breadcrumbs to keep in memory
     * @default 20
     */
    maxBreadcrumbs: number;

    /**
     * Whether breadcrumb collection is enabled
     * @default true
     */
    enabled: boolean;

    /**
     * Automatic breadcrumb collection settings
     */
    autoCollect: {
        /**
         * Automatically collect navigation events (route changes)
         * @default true
         */
        navigation: boolean;

        /**
         * Automatically collect HTTP/XHR requests
         * @default true
         */
        xhr: boolean;
    };

    /**
     * Optional filter/modifier function before adding breadcrumb
     * Return null to discard breadcrumb
     */
    beforeBreadcrumb?: (
        breadcrumb: Breadcrumb,
        hint?: unknown,
    ) => Breadcrumb | null;
}
