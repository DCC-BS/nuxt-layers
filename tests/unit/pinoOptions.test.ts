import { pino } from "pino";
import { describe, expect, it } from "vitest";
import { BreadcrumbManager } from "../../pino-logger/shared/utils/breadcrumbManager";
import { createBreadcrumbAwareLogger } from "../../pino-logger/shared/utils/pinoBreadcrumbWrapper";
import { createServerPinoOptions } from "../../pino-logger/shared/utils/pinoOptions";

function capture(app?: string) {
    const lines: Record<string, unknown>[] = [];
    const stream = {
        write(line: string) {
            lines.push(JSON.parse(line));
        },
    };
    const logger = pino(
        createServerPinoOptions({
            logger: "api",
            app,
            level: "trace",
            production: true,
        }),
        stream,
    );
    return { logger, lines };
}

describe("createServerPinoOptions (production)", () => {
    it("writes the contract's reserved fields", () => {
        const { logger, lines } = capture("text-mate-frontend");
        logger.child({ request_id: "abc-123" }).info({ count: 3 }, "hello");

        const line = lines[0];
        expect(Object.keys(line).sort()).toEqual(
            [
                "app",
                "count",
                "level",
                "logger",
                "message",
                "request_id",
                "timestamp",
            ].sort(),
        );
        expect(line).toMatchObject({
            level: "info",
            app: "text-mate-frontend",
            logger: "api",
            request_id: "abc-123",
            message: "hello",
            count: 3,
        });
        expect(line.timestamp).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        );
    });

    it("omits app when not configured", () => {
        const { logger, lines } = capture();
        logger.info("hi");
        expect(lines[0]).not.toHaveProperty("app");
    });

    it("maps pino levels to the contract names", () => {
        const { logger, lines } = capture();
        logger.trace("t");
        logger.debug("d");
        logger.warn("w");
        logger.error("e");
        logger.fatal("f");
        expect(lines.map((l) => l.level)).toEqual([
            "debug",
            "debug",
            "warning",
            "error",
            "critical",
        ]);
    });

    it("writes errors as error / error_type / exception strings", () => {
        const { logger, lines } = capture();
        logger.error(new TypeError("boom"));
        logger.error({ err: new RangeError("bad") }, "failed");
        logger.error({ error: new Error("x") }, "failed");

        expect(lines[0]).toMatchObject({
            message: "boom",
            error: "boom",
            error_type: "TypeError",
        });
        expect(lines[0].exception).toContain("TypeError: boom");
        expect(lines[0]).not.toHaveProperty("err");
        expect(lines[1]).toMatchObject({
            message: "failed",
            error: "bad",
            error_type: "RangeError",
        });
        expect(lines[2]).toMatchObject({ error: "x", error_type: "Error" });
    });

    it("keeps error fields from the selected Error when several are logged", () => {
        const { logger, lines } = capture();
        logger.error(
            {
                err: new TypeError("first"),
                error: new RangeError("second"),
                exception: "spoofed",
            },
            "two errors",
        );
        expect(lines[0]).toMatchObject({
            error: "first",
            error_type: "TypeError",
        });
        expect(lines[0].exception).toContain("TypeError: first");
    });

    it("never throws on an invalid Date", () => {
        const { logger, lines } = capture();
        expect(() =>
            logger.info({ at: new Date(Number.NaN) }, "bad date"),
        ).not.toThrow();
        expect(lines[0]).toMatchObject({ at: "Invalid Date" });
    });

    it("serializes nested objects and arrays to JSON strings", () => {
        const { logger, lines } = capture();
        logger.info({ options: { a: 1 }, ids: [1, 2], ok: true }, "nested");
        expect(lines[0]).toMatchObject({
            options: '{"a":1}',
            ids: "[1,2]",
            ok: true,
        });
    });

    it("works through the breadcrumb wrapper (Error, breadcrumbs)", () => {
        const { logger, lines } = capture();
        const wrapped = createBreadcrumbAwareLogger(
            logger,
            new BreadcrumbManager({
                enabled: true,
                maxBreadcrumbs: 5,
                autoCollect: { navigation: false, xhr: false },
            }),
        );
        wrapped.info("first");
        wrapped.error(new Error("kaputt"), "second");
        wrapped.warn({ status_code: 503 });

        expect(lines[0]).not.toHaveProperty("breadcrumbs");
        expect(typeof lines[1].breadcrumbs).toBe("string");
        expect(lines[1]).toMatchObject({
            message: "second",
            error: "kaputt",
            error_type: "Error",
        });
        expect(lines[2]).toMatchObject({ level: "warning", status_code: 503 });
    });
});
