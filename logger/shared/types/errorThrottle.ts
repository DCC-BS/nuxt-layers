export interface ErrorThrottleConfig {
    /**
     * Whether repeated error log suppression is enabled
     * @default true
     */
    enabled: boolean;

    /**
     * Length of the rolling window (in milliseconds) within which duplicate
     * errors are counted against the suppression threshold.
     * @default 60 * 60 * 1000
     */
    windowMs: number;

    /**
     * Maximum number of times an error with the same signature is logged in
     * full within a single window before subsequent occurrences are suppressed.
     * @default 1
     */
    maxPerWindow: number;

    /**
     * Maximum number of distinct error signatures tracked in memory.
     * When exceeded, the stalest entries are evicted.
     * @default 1000
     */
    maxKeys: number;
}
