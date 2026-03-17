import {
    createError,
    defineEventHandler,
    getQuery,
    sendRedirect,
    setCookie,
} from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import { COOKIE_MAX_AGE, SESSION_COOKIE_NAME } from "../../../utils/authUtils";
import { authSessionPayloadSchema } from "../../../types/authTypes";

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

    const scopes = getScopes();

    const tokenResponse = await msalClient.acquireTokenByCode({
        code,
        scopes: scopes,
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

    if (!tokenResponse.accessToken) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to acquire API access token",
        })
    }

    const apiAccessToken = tokenResponse.accessToken;
    const decoded = decodeJwtPayload(tokenResponse.accessToken);

    if(!decoded) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid API access token",
        })
    }

    let apiAccessTokenExpiresAt = decoded.exp;

    const sessionPayload = authSessionPayloadSchema.parse({
        userId: payload.oid,
        email:
            payload.email ||
            payload.preferred_username ||
            "",
        name: payload.name,
        roles: payload.roles || [],
        apiAccessToken,
        apiAccessTokenExpiresAt,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
        inMsTeams: false,
        account: tokenResponse.account,
    });

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
