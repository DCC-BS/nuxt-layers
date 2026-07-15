import { LogThrottler } from "#layers/pino-logger/shared/utils/logThrottler";

let throttler: LogThrottler | null = null;

/**
 * Returns a process-wide singleton LogThrottler.
 *
 * Unlike the breadcrumb manager (which is per-event), throttle state must
 * persist across requests, so it lives at module scope.
 */
export function getLogThrottler(): LogThrottler {
    if (throttler) {
        return throttler;
    }

    const config = useRuntimeConfig().public.logger.errorThrottle;
    throttler = new LogThrottler(config);
    return throttler;
}
