import {
    createError,
    defineEventHandler,
    type EventHandler,
    type EventHandlerRequest,
    type H3Event,
} from "h3";
import type {
    BackendTransformer,
    BodyProvider,
    Fetcher,
    FetcherOptions,
    FetchMethodOptionType,
    FetchMethodType,
} from "../types";
import {
    defaultBodyProvider,
    defaultFetcher,
    defaultTransformer,
    getDefaultBodyProvider,
} from "../types";
import {
    createDummyFetcher,
    type DummyFetcherData,
    defaultDummyFetcher,
} from "../types/dummy_fetcher";

type FetchOptionsExtender<TBody> = (
    options: FetcherOptions<TBody>,
) => Promise<FetcherOptions<TBody>>;

type BuildContext<
    TRequest extends EventHandlerRequest,
    TBody,
    TResponse,
    TResponseTransformed,
> = {
    fetcher: Fetcher<TBody, TResponse>;
    dummyFetcher: Fetcher<TBody, TResponse>;
    bodyProvider: BodyProvider<TRequest, TBody> | undefined;
    method: FetchMethodType;
    postFetchTransformer: BackendTransformer<TResponse, TResponseTransformed>;
    extendFetchOptions: FetchOptionsExtender<TBody>;
};

async function defaultExtendFetchOptions<TBody>(
    options: FetcherOptions<TBody>,
) {
    return options;
}

export function backendHandlerBuilder<
    TRequest extends EventHandlerRequest,
    TBody = unknown,
    TResponse = unknown,
    TResponseTransformed = TResponse,
>(
    context:
        | BuildContext<TRequest, TBody, TResponse, TResponseTransformed>
        | undefined = undefined,
) {
    const ctx = {
        fetcher: defaultFetcher<TBody, TResponse>,
        dummyFetcher: defaultDummyFetcher<TResponse>,
        bodyProvider: defaultBodyProvider<TRequest, TBody>(),
        method: "INHERIT" as FetchMethodType,
        postFetchTransformer: defaultTransformer as BackendTransformer<
            TResponse,
            TResponseTransformed
        >,
        extendFetchOptions: defaultExtendFetchOptions<TBody>,
        ...(context ?? {}),
    };

    function withFetcher<TNewResponse>(
        fetcher: Fetcher<TBody, TNewResponse> | undefined = undefined,
    ) {
        const { withBodyProvider, withFetcher, ...builder } =
            backendHandlerBuilder<TRequest, TBody, TNewResponse, TNewResponse>({
                ...ctx,
                fetcher: fetcher ?? defaultFetcher<TBody, TNewResponse>,
                dummyFetcher: defaultDummyFetcher<TNewResponse>,
                postFetchTransformer: defaultTransformer as BackendTransformer<
                    TNewResponse,
                    TNewResponse
                >,
            });
        return builder;
    }

    function withDummyFetcher<TNewResponse extends TResponse = TResponse>(
        dummyData: DummyFetcherData<TBody, TNewResponse>,
    ) {
        const { withBodyProvider, withFetcher, withDummyFetcher, ...builder } =
            backendHandlerBuilder<TRequest, TBody, TResponse, TResponse>({
                ...ctx,
                dummyFetcher: createDummyFetcher<TBody, TNewResponse>(
                    dummyData,
                ),
                postFetchTransformer: defaultTransformer as BackendTransformer<
                    TResponse,
                    TResponse
                >,
            });
        return builder;
    }

    function withBodyProvider<TNewBody>(
        bodyProvider: BodyProvider<TRequest, TNewBody> | undefined = undefined,
    ) {
        const { withBodyProvider, ...builder } = backendHandlerBuilder<
            TRequest,
            TNewBody,
            TResponse,
            TResponseTransformed
        >({
            ...ctx,
            bodyProvider:
                bodyProvider ?? defaultBodyProvider<TRequest, TNewBody>(),
            fetcher: defaultFetcher<TNewBody, TResponse>,
            dummyFetcher: defaultDummyFetcher<TResponse>,
            extendFetchOptions:
                ctx.extendFetchOptions as unknown as FetchOptionsExtender<TNewBody>,
        });

        return builder;
    }

    function withMethod(method: FetchMethodType) {
        return backendHandlerBuilder({ ...ctx, method });
    }

    function extendFetchOptions(extender: FetchOptionsExtender<TBody>) {
        return backendHandlerBuilder({
            ...ctx,
            extendFetchOptions: async (options) =>
                extender(await ctx.extendFetchOptions(options)),
        });
    }

    function postMap<TMap>(
        transformer: BackendTransformer<TResponseTransformed, TMap>,
    ) {
        const { withBodyProvider, withFetcher, ...builder } =
            backendHandlerBuilder({
                ...ctx,
                postFetchTransformer: async (x) =>
                    transformer(await ctx.postFetchTransformer(x)),
            });

        return builder;
    }

    function build(
        url: string | ((event: H3Event) => string),
    ): EventHandler<TRequest, Promise<TResponseTransformed>> {
        return defineEventHandler<TRequest>(async (event: H3Event) => {
            try {
                const {
                    bodyProvider,
                    fetcher,
                    dummyFetcher,
                    extendFetchOptions,
                    postFetchTransformer,
                } = ctx;

                const parsedUrl =
                    typeof url === "string"
                        ? parseUrl(url, event)
                        : parseUrl(url(event), event);

                // Get runtime configuration for API base URL
                const config = useRuntimeConfig();

                if (!config.apiUrl) {
                    throw new Error(
                        "API URL is not configured in runtime config. Set the env variable API_URL.",
                    );
                }

                const method: FetchMethodOptionType =
                    ctx.method === "INHERIT"
                        ? (event.method.toUpperCase() as FetchMethodOptionType)
                        : ctx.method;

                // Extract request body using the configured body provider
                let bodyProviderOrDefault = bodyProvider;
                if (!bodyProviderOrDefault) {
                    bodyProviderOrDefault = getDefaultBodyProvider(method);
                }

                const body = await bodyProviderOrDefault(event);
                const options = await extendFetchOptions({
                    url: `${config.apiUrl}${parsedUrl}`,
                    method,
                    body: body,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    event,
                });

                // Make authenticated request to backend API using the configured fetcher
                const backendResponse =
                    config.useDummyData === "true"
                        ? await dummyFetcher(options)
                        : await fetcher(options);

                return await postFetchTransformer(backendResponse);
            } catch (err: unknown) {
                handleError(err);
            }
        });
    }

    return {
        withMethod,
        extendFetchOptions,
        withBodyProvider,
        withFetcher,
        withDummyFetcher,
        postMap,
        build,
    };
}

function parseUrl(url: string, event: H3Event) {
    const query = getQuery(event);

    let parsedUrl = url.replace(/\[q:([^\]]+)\]/g, (_, queryName) => {
        const value = query[queryName];
        if (value === undefined || value === null) {
            console.warn(`Missing query parameter: ${queryName}`);
        }
        return (value as string) ?? "";
    });

    parsedUrl = parsedUrl.replace(/\[r:([^\]]+)\]/g, (_, paramName) => {
        const value = getRouterParam(event, paramName);
        if (!value) {
            console.warn(`Missing router parameter: ${paramName}`);
        }
        return value ?? "";
    });

    return parsedUrl;
}

function handleError(err: unknown) {
    let errorMessage = "An unexpected error occurred";
    let errorCode = 500;
    let statusMessage = "Backend Communication Error";

    if (typeof err === "string") {
        errorMessage = err;
    } else if (err instanceof Error) {
        errorMessage = err.message;
    }

    if (typeof err === "object" && err && "statusCode" in err) {
        if ("statusCode" in err) {
            errorCode = err.statusCode as number;
        }
        if ("statusMessage" in err) {
            statusMessage = err.statusMessage as string;
        }
    }

    // preserve error structure for client
    if (err && typeof err === "object" && "statusCode" in err) {
        throw createError({
            statusCode: errorCode,
            statusMessage: statusMessage,
            message: errorMessage,
            data: { originalError: err },
        });
    }

    // Wrap other errors in a consistent format
    throw createError({
        statusCode: 500,
        statusMessage: "Backend Communication Error",
        message:
            err instanceof Error ? err.message : "An unexpected error occurred",
        data: { originalError: err },
    });
}
