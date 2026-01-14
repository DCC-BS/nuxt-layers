import type { FetcherOptions } from "./fetcher";

export function defaultDummyFetcher<TBody, TResponse>(
    options: FetcherOptions<TBody>,
): Promise<TResponse> {
    const { url, event } = options;

    const logger = getEventLogger(event);

    logger.trace(options, `fetching data from ${url}`);

    return new Promise((resolve, _) => {
        setTimeout(() => {
            resolve({} as TResponse);
        }, 1000);
    });
}
