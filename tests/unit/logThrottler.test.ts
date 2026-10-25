import { describe, expect, it } from "vitest";
import { LogThrottler } from "../../pino-logger/shared/utils/logThrottler";

describe("LogThrottler", () => {
    it("allows maxPerWindow occurrences per key, then suppresses", () => {
        const throttler = new LogThrottler({ maxPerWindow: 2, windowMs: 1000 });

        expect(throttler.check("GET /a 500", 0).allow).toBe(true);
        expect(throttler.check("GET /a 500", 1).allow).toBe(true);
        expect(throttler.check("GET /a 500", 2).allow).toBe(false);
        // other keys are independent
        expect(throttler.check("GET /b 500", 3).allow).toBe(true);
    });

    it("reports suppressed occurrences once the window rolls over", () => {
        const throttler = new LogThrottler({ maxPerWindow: 1, windowMs: 1000 });

        throttler.check("k", 0);
        throttler.check("k", 10);
        throttler.check("k", 20);

        const next = throttler.check("k", 1000);
        expect(next.allow).toBe(true);
        expect(next.summary).toEqual({ key: "k", suppressedCount: 2, windowMs: 1000 });

        // the summary is reported only once
        expect(throttler.check("k", 2000).summary).toBeUndefined();
    });

    it("evicts the stalest keys beyond maxKeys", () => {
        const throttler = new LogThrottler({ maxPerWindow: 1, maxKeys: 2, windowMs: 10_000 });

        throttler.check("old", 0);
        throttler.check("mid", 1);
        throttler.check("new", 2); // evicts "old"

        // "old" starts fresh again, so it is allowed; "mid" is still throttled
        expect(throttler.check("old", 3).allow).toBe(true);
        expect(throttler.check("new", 4).allow).toBe(false);
    });

    it("allows everything when disabled", () => {
        const throttler = new LogThrottler({ enabled: false, maxPerWindow: 1 });
        for (let i = 0; i < 5; i++) {
            expect(throttler.check("k", i)).toEqual({ allow: true });
        }
    });
});
