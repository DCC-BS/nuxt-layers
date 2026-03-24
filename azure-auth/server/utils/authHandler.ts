export const authHandler = backendHandlerBuilder().extendFetchOptions(
    async (options) => {
        const { apiAccessToken } = await getAuthContext(options.event);

        console.log("access token is", apiAccessToken);

        return {
            ...options,
            headers: {
                ...options.headers,
                Authorization: `Bearer ${apiAccessToken}`,
            },
        };
    },
);
