import { createError, getCookie, type H3Event } from "h3";
import { jwtVerify, SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";

import { tokenPayloadSchema, TokenPayload, AuthSessionPayload, AuthSession } from "../types/authTypes";
import { z } from "zod";

export const SESSION_COOKIE_NAME = "auth_session";
export const MS_TEAMS_FLAG_COOKIE_NAME = "auth_ms_treams";
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;
export const COOKIE_MAX_AGE = 60 * 60 * 24;

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

        console.log("ACCCOUNT", payload.account);

        const result = await getOrRefreshAccessToken(event, payload);

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

export async function getOrRefreshAccessToken(
    event: H3Event,
    payload: AuthSessionPayload,
) {
    const msalClient = getMsalClient();

    return await msalClient.acquireTokenSilent({
        account: payload.account,
        scopes: getScopes(),
    });

    // const config = useRuntimeConfig();
    // const secret = new TextEncoder().encode(config.azureAuth.secret);

    // let apiAccessToken = payload.apiAccessToken;
    // let apiAccessTokenExpiresAt = payload.apiAccessTokenExpiresAt;
    // let refreshToken = payload.refreshToken;

    // if (isTokenExpired(apiAccessTokenExpiresAt) && refreshToken) {
    //     console.log("API access token expired, attempting to refresh...");
    //     const refreshed = await refreshAccessToken(refreshToken);

    //     if (refreshed) {
    //         apiAccessToken = refreshed.accessToken;
    //         apiAccessTokenExpiresAt = refreshed.expiresAt;
    //         if (refreshed.refreshToken) {
    //             refreshToken = refreshed.refreshToken;
    //         }

    //         const updatedPayload: AuthSessionPayload = {
    //             ...payload,
    //             apiAccessToken,
    //             apiAccessTokenExpiresAt,
    //             refreshToken,
    //             iat: Math.floor(Date.now() / 1000),
    //             exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
    //         };

    //         const newToken = await new SignJWT(updatedPayload)
    //             .setProtectedHeader({ alg: "HS256" })
    //             .setIssuedAt()
    //             .setExpirationTime(`${COOKIE_MAX_AGE}s`)
    //             .sign(secret);

    //         const isMsTeams = getCookie(event, MS_TEAMS_FLAG_COOKIE_NAME)?.trim().toLocaleLowerCase() === "true";

    //         setCookie(event, SESSION_COOKIE_NAME, newToken, {
    //             httpOnly: true,
    //             secure: true,
    //             sameSite: isMsTeams ? "none" : "lax",
    //             path: "/",
    //             maxAge: COOKIE_MAX_AGE,
    //         });
    //     }
    // }

    // return {
    //     apiAccessToken,
    //     refreshToken,
    //     apiAccessTokenExpiresAt,
    // };
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

    const tokenExpired = isTokenExpired(session.apiAccessTokenExpiresAt);

    if (tokenExpired) {
        throw createError({
            statusCode: 401,
            statusMessage: "Unauthorized",
            message: "API access token has expired. Please sign in again.",
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

export function decodeJwtPayload(
    token: string,
): TokenPayload | null {
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
            console.error("JWT payload validation error: \n", z.prettifyError(error));
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
