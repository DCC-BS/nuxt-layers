import { createError, getCookie, type H3Event } from "h3";
import { jwtVerify } from "jose";
import { z } from "zod";
import { useRuntimeConfig } from "#imports";
import {
    type AuthSession,
    type AuthSessionPayload,
    type TokenPayload,
    tokenPayloadSchema,
} from "../types/authTypes";

export const SESSION_COOKIE_NAME = "auth_session";
export const MS_TEAMS_FLAG_COOKIE_NAME = "auth_ms_treams";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;
export const COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day

export function getScopes() {
    const authConfig = getAuthConfig();
    return [
        "openid",
        "profile",
        "email",
        "offline_access",
        "User.Read",
        `api://${authConfig.apiClientId}/user_impersonation`,
    ];
}

export async function getServerSession(
    event: H3Event,
): Promise<AuthSession | null> {
    const cookie = getCookie(event, SESSION_COOKIE_NAME);

    if (!cookie) {
        console.log("No session cookie found");
        return null;
    }

    try {
        const config = useRuntimeConfig();
        const secret = new TextEncoder().encode(config.azureAuth.secret);

        const { payload } = await jwtVerify<AuthSessionPayload>(cookie, secret);
        const result = await getOrRefreshAccessToken(payload);
        console.log("Access token refreshed: ", result.scopes);

        return {
            user: {
                id: payload.userId,
                email: payload.email,
                name: payload.name,
                roles: payload.roles,
            },
            apiAccessToken: result.accessToken,
        };
    } catch (error) {
        console.error("Error verifying session cookie: ", error);
        return null;
    }
}

export async function getOrRefreshAccessToken(payload: AuthSessionPayload) {
    const msalClient = getMsalClient();

    const scopes = getScopes();

    return await msalClient.acquireTokenSilent({
        account: payload.account,
        scopes: scopes,
    });
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

export function decodeJwtPayload(token: string): TokenPayload | null {
    try {
        const base64Url = token.split(".")[1];
        if (!base64Url) return null;

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join(""),
        );

        return tokenPayloadSchema.parse(JSON.parse(jsonPayload));
    } catch (error) {
        if (error instanceof z.ZodError) {
            console.error(
                "JWT payload validation error: \n",
                z.prettifyError(error),
            );
        } else {
            console.error("Error decoding JWT payload: \n", String(error));
        }

        return null;
    }
}

export async function refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresAt: number;
    refreshToken?: string;
} | null> {
    try {
        const msalClient = getMsalClient();
        const scopes = getScopes();

        const response = await msalClient.acquireTokenByRefreshToken({
            refreshToken,
            scopes: scopes,
        });

        if (!response?.accessToken) {
            return null;
        }

        const decoded = decodeJwtPayload(response.accessToken);
        const expiresAt =
            decoded?.exp && typeof decoded.exp === "number"
                ? decoded.exp
                : Math.floor(Date.now() / 1000) + 3600;

        return {
            accessToken: response.accessToken,
            expiresAt,
            refreshToken: (response as unknown as { refreshToken?: string })
                .refreshToken,
        };
    } catch {
        return null;
    }
}

export function isTokenExpired(expiresAt: number | undefined): boolean {
    if (!expiresAt) return true;
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    return expiresAt <= currentTimeInSeconds + TOKEN_EXPIRY_BUFFER_SECONDS;
}
