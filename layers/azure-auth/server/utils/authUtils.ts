import { getServerSession, getToken } from "#auth";
import { type H3Event, createError } from "h3";
import type { ExtendedJWT, ExtendedSession } from "../types/authTypes";

export async function getAuthContext(event: H3Event) {
    // Get authentication session and token
    const session = await getServerSession(event);
    const token = (await getToken({
        event,
    })) as ExtendedJWT | undefined;

    // Check for session error (token refresh failed)
    // This happens when refresh tokens expire or become invalid
    if (
        (session as ExtendedSession)?.error ===
        "RefreshAccessTokenError"
    ) {
        throw createError({
            statusCode: 401,
            statusMessage: "Token Refresh Failed",
            message:
                "Authentication tokens have expired and could not be refreshed. Please sign in again.",
        });
    }

    // Ensure user is authenticated
    if (!session || !token) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "You must be logged in to access this resource.",
        });
    }

    if (!("apiAccessToken" in session)) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "You must be logged in to access this resource.",
        });
    }

    // Extract access token for backend authentication
    const apiAccessToken = session?.apiAccessToken;

    return {
        session,
        token,
        apiAccessToken
    }
}
