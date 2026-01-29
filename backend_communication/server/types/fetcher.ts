import { apiFetch, isApiError } from "@dcc-bs/communication.bs.js";
import type { H3Event } from "h3";

export type FetchMethodOptionType = "GET" | "POST" | "PUT" | "DELETE";
export type FetchMethodType = "INHERIT" | FetchMethodOptionType;

export type FetcherOptions<TBody> = {
    url: string;
    method: FetchMethodOptionType;
    body: TBody;
    headers: Record<string, string>;
    event: H3Event;
};

/**
 * Function type for making HTTP requests to the backend
 * @template T - The response type from the backend
 */
export type Fetcher<TBody, TResponse> = (
    options: FetcherOptions<TBody>,
) => Promise<TResponse>;

/**
 * Default fetcher that uses Nuxt's $fetch utility
 * @template T - The response type from the backend
 * @param url - The full URL to fetch from
 * @param method - HTTP method to use
 * @param body - Request body (will be JSON stringified)
 * @param headers - HTTP headers to include
 * @returns Promise resolving to the backend response
 */
export async function defaultFetcher<TBody, TResponse>(
    options: FetcherOptions<TBody>,
): Promise<TResponse> {
    const { url, method, body, headers, event } = options;

    const signal = getAbortSignal(event);
    const logger = getEventLogger(event);

    if (typeof body !== "object" && body !== undefined) {
        throw new Error(`Request body must be object or undefined, got: ${typeof body}`);
    }

    const response = await apiFetch(url, {
        method,
        body: body as object | undefined,
        headers,
        signal,
    });

    if (isApiError(response)) {
        logger.error(response, `API Error on fetch to ${url}`);
        throw response;
    }

    return response as TResponse;
}

export async function rawFetcher<TBody>(
    options: FetcherOptions<TBody>,
): Promise<Response> {
    const body = (options.body) ? JSON.stringify(options.body) : undefined;

    const signal = getAbortSignal(options.event);

    return await fetch(options.url, {
        method: options.method,
        body: body,
        headers: options.headers,
        signal: signal,
    });
}
