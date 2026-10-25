import { describe, expect, it } from "vitest";
import {
    extractEventBody,
    getDefaultBodyProvider,
    noBody,
} from "../../backend_communication/server/types/body_provider";
import { createDummyFetcher } from "../../backend_communication/server/types/dummy_fetcher";
import type { FetcherOptions } from "../../backend_communication/server/types/fetcher";
import { toJsonlStream, toSSEStream } from "../../backend_communication/server/utils/stream_helper";

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
    return await new Response(stream).text();
}

const options = { url: "http://backend/x", method: "POST", body: { a: 1 }, headers: {} } as unknown as FetcherOptions<{ a: number }>;

describe("getDefaultBodyProvider", () => {
    it("sends no body for GET and DELETE, and the request body otherwise", () => {
        expect(getDefaultBodyProvider("GET")).toBe(noBody);
        expect(getDefaultBodyProvider("DELETE")).toBe(noBody);
        expect(getDefaultBodyProvider("POST")).toBe(extractEventBody);
        expect(getDefaultBodyProvider("PUT")).toBe(extractEventBody);
    });
});

describe("createDummyFetcher", () => {
    it("returns static dummy data", async () => {
        await expect(createDummyFetcher({ ok: true })(options)).resolves.toEqual({ ok: true });
    });

    it("calls a dummy function with the fetch options", async () => {
        const fetcher = createDummyFetcher((o: FetcherOptions<{ a: number }>) => ({ got: o.body.a }));
        await expect(fetcher(options)).resolves.toEqual({ got: 1 });
    });
});

describe("stream helpers", () => {
    it("writes JSON lines", async () => {
        expect(await readAll(toJsonlStream([{ a: 1 }, { b: 2 }]))).toBe('{"a":1}\n{"b":2}\n');
    });

    it("writes server-sent events", async () => {
        expect(await readAll(toSSEStream([{ a: 1 }]))).toBe('data: {"a":1}\n\n');
    });
});
