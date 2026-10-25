import { describe, expect, it } from "vitest";
import {
    BreadcrumbManager,
    DEFAULT_BREADCRUMB_CONFIG,
} from "../../pino-logger/shared/utils/breadcrumbManager";

function manager(overrides: Partial<typeof DEFAULT_BREADCRUMB_CONFIG> = {}) {
    return new BreadcrumbManager({ ...DEFAULT_BREADCRUMB_CONFIG, ...overrides });
}

describe("BreadcrumbManager", () => {
    it("keeps only the newest maxBreadcrumbs", () => {
        const crumbs = manager({ maxBreadcrumbs: 3 });
        for (let i = 0; i < 5; i++) {
            crumbs.addBreadcrumb({ message: `m${i}` });
        }
        expect(crumbs.getBreadcrumbs().map((c) => c.message)).toEqual(["m2", "m3", "m4"]);
    });

    it("defaults the level to info and adds a timestamp", () => {
        const crumbs = manager();
        crumbs.addBreadcrumb({ message: "hello" });
        const [crumb] = crumbs.getBreadcrumbs();
        expect(crumb?.level).toBe("info");
        expect(typeof crumb?.timestamp).toBe("number");
    });

    it("truncates long messages to 2048 characters", () => {
        const crumbs = manager();
        crumbs.addBreadcrumb({ message: "x".repeat(5000) });
        expect(crumbs.getBreadcrumbs()[0]?.message).toHaveLength(2048);
    });

    it("lets beforeBreadcrumb drop or rewrite breadcrumbs", () => {
        const crumbs = new BreadcrumbManager({
            ...DEFAULT_BREADCRUMB_CONFIG,
            beforeBreadcrumb: (crumb) =>
                crumb.message === "secret" ? null : { ...crumb, message: crumb.message?.toUpperCase() },
        });
        crumbs.addBreadcrumb({ message: "secret" });
        crumbs.addBreadcrumb({ message: "public" });
        expect(crumbs.getBreadcrumbs().map((c) => c.message)).toEqual(["PUBLIC"]);
    });

    it("records nothing when disabled", () => {
        const crumbs = manager({ enabled: false });
        crumbs.addBreadcrumb({ message: "ignored" });
        expect(crumbs.getBreadcrumbs()).toHaveLength(0);
    });

    it("clones independently", () => {
        const crumbs = manager();
        crumbs.addBreadcrumb({ message: "a" });
        const copy = crumbs.clone();
        copy.addBreadcrumb({ message: "b" });
        expect(crumbs.getBreadcrumbs()).toHaveLength(1);
        expect(copy.getBreadcrumbs()).toHaveLength(2);
    });
});
