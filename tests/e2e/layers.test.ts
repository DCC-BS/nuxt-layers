import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";
import { fileURLToPath } from "node:url";
import { $fetch, fetch, setup } from "@nuxt/test-utils/e2e";
import { afterAll, beforeEach, describe, expect, it } from "vitest";

function layer(name: string): string {
    return fileURLToPath(new URL(`../../${name}`, import.meta.url));
}

type Received = { method?: string; url?: string; body: string; contentType?: string };

// A stand-in for the app's Python backend (API_URL).
const backend = {
    received: [] as Received[],
    readinessStatus: 200,
    echoStatus: 200,
};

function readBody(req: IncomingMessage): Promise<string> {
    return new Promise((resolve) => {
        let data = "";
        req.on("data", (chunk) => {
            data += chunk;
        });
        req.on("end", () => resolve(data));
    });
}

const backendServer = createServer(async (req, res) => {
    const body = await readBody(req);
    backend.received.push({
        method: req.method,
        url: req.url,
        body,
        contentType: req.headers["content-type"],
    });
    res.setHeader("Content-Type", "application/json");

    if (req.url === "/health/readiness") {
        res.statusCode = backend.readinessStatus;
        res.end(JSON.stringify({ status: backend.readinessStatus === 200 ? "ready" : "down" }));
        return;
    }
    if (req.url?.startsWith("/echo/")) {
        res.statusCode = backend.echoStatus;
        res.end(
            backend.echoStatus === 200
                ? JSON.stringify({ echoed: JSON.parse(body || "null") })
                : JSON.stringify({ errorId: "not_found", debugMessage: "no such item" }),
        );
        return;
    }
    if (req.url === "/items") {
        res.end(JSON.stringify([1, 2, 3]));
        return;
    }
    res.statusCode = 404;
    res.end("{}");
});

await new Promise<void>((resolve) => backendServer.listen(0, "127.0.0.1", resolve));
const backendUrl = `http://127.0.0.1:${(backendServer.address() as AddressInfo).port}`;

afterAll(() => {
    backendServer.close();
});

beforeEach(() => {
    backend.received = [];
    backend.readinessStatus = 200;
    backend.echoStatus = 200;
});

// Build-time env: same switches the apps use, pointed at this checkout.
process.env.NUXT_LAYERS_LOCAL = "true";
process.env.AUTH_LAYER_URI = layer("no-auth");
process.env.LOGGER_LAYER_URI = layer("pino-logger");

await setup({
    rootDir: fileURLToPath(new URL("../fixture", import.meta.url)),
    build: true,
    server: true,
    env: {
        NUXT_API_URL: backendUrl,
        NUXT_PUBLIC_APP_CONFIG_APP_LIST_URL_TEMPLATE: "https://{APP_NAME}.example.test",
    },
});

describe("health_check", () => {
    it("answers liveness and startup without touching the backend", async () => {
        const liveness = await $fetch<{ status: string; uptime: number }>("/api/health/liveness");
        expect(liveness.status).toBe("up");
        expect(liveness.uptime).toBeGreaterThan(0);

        const startup = await $fetch<{ status: string }>("/api/health/startup");
        expect(startup.status).toBe("started");
        expect(backend.received).toHaveLength(0);
    });

    it("is ready when the backend is ready", async () => {
        const readiness = await $fetch<{ status: string; checks: { api: string } }>(
            "/api/health/readiness",
        );
        expect(readiness).toEqual({ status: "ready", checks: { api: "connected" } });
        expect(backend.received.map((r) => r.url)).toEqual(["/health/readiness"]);
    });

    it("returns 503 when the backend is not ready", async () => {
        backend.readinessStatus = 500;
        const res = await fetch("/api/health/readiness");
        expect(res.status).toBe(503);
    });
});

describe("backend_communication", () => {
    it("forwards method, path and query parameters, and the JSON body", async () => {
        const result = await $fetch("/api/proxy/42?q=hello", {
            method: "POST",
            body: { text: "Grüezi" },
        });

        expect(result).toEqual({ echoed: { text: "Grüezi" } });
        expect(backend.received).toHaveLength(1);
        expect(backend.received[0]).toMatchObject({
            method: "POST",
            url: "/echo/42?q=hello",
            contentType: "application/json",
        });
        expect(JSON.parse(backend.received[0]?.body ?? "")).toEqual({ text: "Grüezi" });
    });

    it("reports backend errors as errors, not as success", async () => {
        backend.echoStatus = 404;
        const res = await fetch("/api/proxy/7", {
            method: "POST",
            body: "{}",
            headers: { "Content-Type": "application/json" },
        });
        expect(res.ok).toBe(false);
    });

    // communication.bs.js' ApiError carries `status` (not `statusCode`); it used to become a 500.
    it("keeps the backend's status code", async () => {
        backend.echoStatus = 404;
        const res = await fetch("/api/proxy/7", {
            method: "POST",
            body: "{}",
            headers: { "Content-Type": "application/json" },
        });
        expect(res.status).toBe(404);
    });

    it("sends GET without a body and applies postMap", async () => {
        const result = await $fetch("/api/items");
        expect(result).toEqual({ wrapped: [1, 2, 3] });
        expect(backend.received[0]).toMatchObject({ method: "GET", url: "/items", body: "" });
    });
});

describe("logger + pino-logger", () => {
    it("puts a logger on every server request", async () => {
        expect(await $fetch("/api/log")).toEqual({ logged: true });
    });
});

describe("app page (auth + no-auth, dcc-app-config, feedback-control)", () => {
    it("renders on the server", async () => {
        const html = await $fetch<string>("/");

        // no-auth: auth is off and there is no user
        expect(html).toContain('data-test="auth-enabled">false<');
        // dcc-app-config: the other apps, linked through the URL template
        expect(html).toContain('href="https://transcribo.example.test"');
        expect(html).not.toContain(">TextMate<");
    });
});

describe("feedback-control", () => {
    it("rejects an invalid feedback body before calling GitHub", async () => {
        const res = await fetch("/api/feedback", {
            method: "POST",
            body: JSON.stringify({ message: "hi", email: "not-an-email" }),
            headers: { "Content-Type": "application/json" },
        });
        expect(res.ok).toBe(false);
    });
});
