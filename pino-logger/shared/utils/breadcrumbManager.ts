import type {
    Breadcrumb,
    BreadcrumbConfig,
    BreadcrumbLevel,
} from "#layers/logger/shared/types/breadcrumb";

export const DEFAULT_BREADCRUMB_CONFIG = {
    autoCollect: {
        navigation: true,
        xhr: true
    },
    enabled: true,
    maxBreadcrumbs: 20,
} satisfies BreadcrumbConfig;

export class BreadcrumbManager {
    private breadcrumbs: Breadcrumb[] = [];
    private config: BreadcrumbConfig;
    private droppedCount = 0;

    constructor(config: BreadcrumbConfig) {
        this.config = {
            ...DEFAULT_BREADCRUMB_CONFIG,
            ...config,
            autoCollect: {
                ...DEFAULT_BREADCRUMB_CONFIG.autoCollect,
                ...config.autoCollect,
            },
        };
    }

    addBreadcrumb(crumb: Partial<Breadcrumb>, hint?: unknown): void {
        if (!this.config.enabled) {
            return;
        }

        const breadcrumb: Breadcrumb = {
            timestamp: Date.now() / 1000,
            ...crumb,
        };

        if (!breadcrumb.level) {
            breadcrumb.level = "info" satisfies BreadcrumbLevel;
        }

        let filtered = breadcrumb;

        if (this.config.beforeBreadcrumb) {
            const result = this.config.beforeBreadcrumb(breadcrumb, hint);
            if (!result) {
                return;
            }
            filtered = result;
        }

        if (filtered.message) {
            filtered.message = filtered.message.slice(0, 2048);
        }

        this.breadcrumbs.push(filtered);

        if (this.breadcrumbs.length > this.config.maxBreadcrumbs) {
            this.breadcrumbs = this.breadcrumbs.slice(
                -this.config.maxBreadcrumbs,
            );
            this.droppedCount++;
        }
    }

    getBreadcrumbs(): readonly Breadcrumb[] {
        return Object.freeze([...this.breadcrumbs]);
    }

    clear(): void {
        this.breadcrumbs = [];
    }

    updateConfig(config: Partial<BreadcrumbConfig>): void {
        this.config = { ...this.config, ...config };
    }

    getConfig(): BreadcrumbConfig {
        return { ...this.config };
    }

    clone(): BreadcrumbManager {
        const cloned = new BreadcrumbManager(this.config);
        cloned.breadcrumbs = [...this.breadcrumbs];
        cloned.droppedCount = this.droppedCount;
        return cloned;
    }
}
