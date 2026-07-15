import type { ErrorThrottleConfig } from "#layers/logger/shared/types/errorThrottle";
import { DEFAULT_ERROR_THROTTLE_CONFIG } from "#layers/logger/shared/types/errorThrottle";

interface ThrottleEntry {
    windowStart: number;
    loggedCount: number;
    suppressedCount: number;
}

export interface ThrottleSummary {
    key: string;
    suppressedCount: number;
    windowMs: number;
}

export interface ThrottleResult {
    /**
     * Whether the caller should emit the full log for this occurrence.
     */
    allow: boolean;
    /**
     * When present, a previous window for this key just rolled over and had
     * suppressed occurrences the caller should report in a summary log.
     */
    summary?: ThrottleSummary;
}

export class LogThrottler {
    private readonly entries = new Map<string, ThrottleEntry>();
    private readonly config: ErrorThrottleConfig;

    constructor(config: Partial<ErrorThrottleConfig> = {}) {
        this.config = {
            ...DEFAULT_ERROR_THROTTLE_CONFIG,
            ...config,
        };
    }

    /**
     * Decide whether an error with the given signature should be logged now.
     * Windows roll over lazily (no timers), so this is safe in serverless.
     */
    check(key: string, now = Date.now()): ThrottleResult {
        if (!this.config.enabled) {
            return { allow: true };
        }

        const existing = this.entries.get(key);
        let summary: ThrottleSummary | undefined;

        if (existing && now - existing.windowStart >= this.config.windowMs) {
            if (existing.suppressedCount > 0) {
                summary = {
                    key,
                    suppressedCount: existing.suppressedCount,
                    windowMs: this.config.windowMs,
                };
            }
            this.entries.set(key, {
                windowStart: now,
                loggedCount: 0,
                suppressedCount: 0,
            });
        }

        const entry = this.entries.get(key) ?? this.createEntry(key, now);

        if (entry.loggedCount < this.config.maxPerWindow) {
            entry.loggedCount++;
            return { allow: true, summary };
        }

        entry.suppressedCount++;

        return { allow: false, summary };
    }

    private createEntry(key: string, now: number): ThrottleEntry {
        const entry: ThrottleEntry = {
            windowStart: now,
            loggedCount: 0,
            suppressedCount: 0,
        };
        this.entries.set(key, entry);
        this.evictIfNeeded();
        return entry;
    }

    private evictIfNeeded(): void {
        if (this.entries.size <= this.config.maxKeys) {
            return;
        }

        const excess = this.entries.size - this.config.maxKeys;
        const sorted = [...this.entries.entries()].sort(
            (a, b) => a[1].windowStart - b[1].windowStart,
        );

        for (let i = 0; i < excess; i++) {
            const target = sorted[i];
            if (target) {
                this.entries.delete(target[0]);
            }
        }
    }
}
