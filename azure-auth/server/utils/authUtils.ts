import { createError, getCookie, type H3Event } from "h3";
import { jwtVerify } from "jose";
import { useRuntimeConfig } from "#imports";
import type { Session, SessionPayload } from "../../app/types/session";

const SESSION_COOKIE_NAME = "auth_session";

export async function getServerSession(
    event: H3Event,
): Promise<Session | null> {
    const cookie = getCookie(event, SESSION_COOKIE_NAME);

    if (!cookie) {
        return null;
    }

    try {
        const config = useRuntimeConfig();
        const secret = new TextEncoder().encode(config.azureAuth.secret);

        const { payload } = await jwtVerify<SessionPayload>(cookie, secret);

        return {
            user: {
                id: payload.userId,
                email: payload.email,
                name: payload.name,
                roles: payload.roles,
            },
            apiAccessToken: payload.apiAccessToken,
            apiAccessTokenExpiresAt: payload.apiAccessTokenExpiresAt,
        };
    } catch {
        return null;
    }
}

export async function getAuthContext(event: H3Event) {
    const session = await getServerSession(event);

    if (!session) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "You must be logged in to access this resource.",
        });
    }

    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const tokenExpired =
        session.apiAccessTokenExpiresAt &&
        session.apiAccessTokenExpiresAt <= currentTimeInSeconds;

    if (tokenExpired) {
        throw createError({
            statusCode: 401,
            statusMessage: "Token Expired",
            message:
                "API access token has expired. Please refresh your session.",
        });
    }

    if (!session.apiAccessToken) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "No API access token available. Please sign in again.",
        });
    }

    return {
        session,
        apiAccessToken: session.apiAccessToken,
    };
}

export async function getCurrentUser(event: H3Event) {
    const session = await getServerSession(event);

    if (!session) {
        return null;
    }

    return {
        source: "msal" as const,
        session,
    };
}
