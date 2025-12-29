export const authHandler = buildBackendHandler()
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
