export const authHandler = backendHandlerBuilder()
    .extendFetchOptions(async (options) => {
        const { apiAccessToken } = await getAuthContext(options.event);

        return {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${apiAccessToken}`,
            },
        };
    });
