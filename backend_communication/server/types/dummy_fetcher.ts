import type { Fetcher, FetcherOptions } from "./fetcher";

export type DummyFetcherData<TBody, TResponse> =
    | TResponse
    | ((options: FetcherOptions<TBody>) => TResponse | Promise<TResponse>);

function isFunction<TBody, TResponse>(
    value: unknown,
): value is (options: FetcherOptions<TBody>) => TResponse | Promise<TResponse> {
    return typeof value === "function";
}

export function createDummyFetcher<TBody, TResponse>(
    dummyData: DummyFetcherData<TBody, TResponse>,
): Fetcher<TBody, TResponse> {
    return (options: FetcherOptions<TBody>) => {
        const { url, event } = options;

        const logger = getEventLogger(event);

        logger.debug(options, `fetching data from ${url}`);

        if (isFunction<TBody, TResponse>(dummyData)) {
            const result = dummyData(options);
            return Promise.resolve(result);
        }

        return Promise.resolve(dummyData);
    };
}

export function defaultDummyFetcher<TBody, TResponse>(): Fetcher<
    TBody,
    TResponse
> {
    throw new Error(
        "Default dummy fetcher called without data. Use withDummyFetcher() to provide data.",
    );
}
