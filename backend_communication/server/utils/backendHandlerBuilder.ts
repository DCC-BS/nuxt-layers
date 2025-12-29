import { createError, defineEventHandler, type EventHandler, type EventHandlerRequest, type H3Event } from "h3";
import { useRuntimeConfig } from 'nuxt/app';
import type { FetcherOptions } from '../../../azure-auth/server/models';
import type { BackendTransformer, BodyProvider, Fetcher, FetchMethodType } from '../types';
import { defaultFetcher, defaultTransformer, getDefaultBodyProvider } from '../types';

type FetchOptionsExtender<TBody> = (options: FetcherOptions<TBody>) => Promise<FetcherOptions<TBody>>;

type BuildContext<TRequest extends EventHandlerRequest, TBody, TResponse, TResponseTransformed> = {
    fetcher: Fetcher<TBody, TResponse>;
    bodyProvider: BodyProvider<TRequest, TBody>;
    method: FetchMethodType;
    postFetchTransformer: BackendTransformer<TResponse, TResponseTransformed>;
    extendFetchOptions: FetchOptionsExtender<TBody>,
}

async function defaultExtendFetchOptions<TBodyTransformed>(options: FetcherOptions<TBodyTransformed>) {
    return options;
}

export function buildBackendHandler<TRequest extends EventHandlerRequest, TBody = unknown, TResponse = unknown, TResponseTransformed = TResponse>(
    url: string,
    context: BuildContext<TRequest, TBody, TResponse, TResponseTransformed> | null = null) {

    const ctx = {
        fetcher: defaultFetcher<TBody, TResponse>,
        bodyProvider: getDefaultBodyProvider<TRequest, TBody>(),
        method: "POST" as FetchMethodType,
        postFetchTransformer: defaultTransformer as BackendTransformer<TResponse, TResponseTransformed>,
        extendFetchOptions: defaultExtendFetchOptions<TBody>,
        ...context
    };

    function withFetcher(fetcher: Fetcher<TBody, TResponse>) {
        return buildBackendHandler(url, { ...ctx, fetcher });
    }

    function withBodyProvider(bodyProvider: BodyProvider<TRequest, TBody>) {
        return buildBackendHandler(url, { ...ctx, bodyProvider });
    }

    function withMethod(method: FetchMethodType) {
        return buildBackendHandler(url, { ...ctx, method });
    }

    function extendFetchOptions(extender: FetchOptionsExtender<TBody>) {
        return buildBackendHandler(url, { ...ctx, extendFetchOptions: async (options) => extender(await ctx.extendFetchOptions(options)) });
    }

    function postMap<TMap>(transformer: BackendTransformer<TResponseTransformed, TMap>) {
        return buildBackendHandler(url, {
            ...ctx, postFetchTransformer: async (x) => transformer(await ctx.postFetchTransformer(x))
        });
    }

    function build(): EventHandler<TRequest, Promise<TResponse>> {
        return defineEventHandler<TRequest>(async (event: H3Event) => {
            try {
                const { bodyProvider, fetcher, method, postFetchTransformer } = ctx;

                // Get runtime configuration for API base URL
                const config = useRuntimeConfig();

                // Extract request body using the configured body provider
                const body = await bodyProvider(event);

                // Make authenticated request to backend API using the configured fetcher
                const backendResponse = await fetcher({
                    url: `${config.apiUrl}${url}`,
                    method,
                    body: body,
                    headers: {
                        "Content-Type": "application/json",
                    },
                    event,
                });

                return await postFetchTransformer(backendResponse);
            } catch (err: unknown) {
                handleError(err);
            }
        });
    }

    return {
        withFetcher,
        withBodyProvider,
        withMethod,
        extendFetchOptions,
        postMap,
        build,
    }
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
            err instanceof Error
                ? err.message
                : "An unexpected error occurred",
        data: { originalError: err },
    });
}
