import {
    createError,
    defineEventHandler,
    getQuery,
    sendRedirect,
    setCookie,
} from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import type { SessionPayload } from "../../../../app/types/session";

const SESSION_COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24;

function decodeJwtPayload(token: string): Record<string, unknown> | null {
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
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const code = query.code as string | undefined;
    const state = query.state as string | undefined;

    if (!code) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing authorization code",
        });
    }

    const msalClient = getMsalClient();
    const authConfig = getAuthConfig();
    const config = useRuntimeConfig().azureAuth;

    const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: [
            "openid",
            "profile",
            "email",
            "offline_access",
            `api://${authConfig.apiClientId}/user_impersonation`,
        ],
        redirectUri: authConfig.redirectUri,
    });

    if (!tokenResponse?.idToken) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to acquire token",
        });
    }

    const payload = decodeJwtPayload(tokenResponse.idToken);
    if (!payload) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid ID token",
        });
    }

    let apiAccessToken: string | undefined;
    let apiAccessTokenExpiresAt: number | undefined;

    if (tokenResponse.accessToken) {
        apiAccessToken = tokenResponse.accessToken;
        const decoded = decodeJwtPayload(tokenResponse.accessToken);
        if (decoded?.exp && typeof decoded.exp === "number") {
            apiAccessTokenExpiresAt = decoded.exp;
        }
    }

    const sessionPayload: SessionPayload = {
        userId: (payload.oid as string) || (payload.sub as string) || "",
        email:
            (payload.preferred_username as string) ||
            (payload.email as string) ||
            "",
        name: (payload.name as string) || "",
        roles: (payload.roles as string[]) || [],
        apiAccessToken,
        apiAccessTokenExpiresAt,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
    };

    const secret = new TextEncoder().encode(config.secret);
    const token = await new SignJWT(sessionPayload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${COOKIE_MAX_AGE}s`)
        .sign(secret);

    setCookie(event, SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });

    const redirectPath = state || "/";
    return sendRedirect(event, redirectPath);
});
