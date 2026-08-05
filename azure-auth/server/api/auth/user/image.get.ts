export default defineEventHandler(async (event) => {
    const { apiAccessToken } = await getAuthContext(event);
    const logger = getEventLogger(event);

    if (!apiAccessToken) {
        logger.error("No API access token available in session");
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "No API access token available. Please sign in again.",
        });
    }


    const imageUrl = await fetch(
        "https://graph.microsoft.com/v1.0/me/photo/$value",
        {
            headers: {
                Authorization: `Bearer ${apiAccessToken}`,
            },
        },
    );

    if (!imageUrl) {
        throw createError({
            statusCode: 404,
            statusMessage: "Not Found",
            message: "User photo not found.",
        });
    }

    return imageUrl;
});
