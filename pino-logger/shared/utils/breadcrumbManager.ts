import type {
    Breadcrumb,
    BreadcrumbConfig,
    BreadcrumbLevel,
} from "#layers/logger/shared/types/breadcrumb";
import { DEFAULT_BREADCRUMB_CONFIG } from "#layers/logger/shared/types/breadcrumb";

export class BreadcrumbManager {
    private breadcrumbs: Breadcrumb[] = [];
    private config: BreadcrumbConfig;
    private droppedCount = 0;

    constructor(config: BreadcrumbConfig) {
        this.config = { ...DEFAULT_BREADCRUMB_CONFIG, ...config };
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

        const filtered = this.config.beforeBreadcrumb?.(breadcrumb, hint);
        if (!filtered) {
            return;
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
