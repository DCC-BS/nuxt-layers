import type { AccountInfo } from "@azure/msal-node";
import {
    createError,
    defineEventHandler,
    getQuery,
    sendRedirect,
    setCookie,
} from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import { authSessionPayloadSchema } from "../../../types/authTypes";
import { COOKIE_MAX_AGE, SESSION_COOKIE_NAME } from "../../../utils/authUtils";

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

    console.log("scopes", scopes);

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
        });
    }

    const account = tokenResponse.account;

    if (!account) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to retrieve account information",
        });
    }

    const sessionPayload = authSessionPayloadSchema.parse({
        userId: payload.oid,
        email: payload.email || payload.preferred_username || "",
        name: payload.name,
        roles: payload.roles || [],
        inMsTeams: false,
        account: {
            environment: account.environment,
            homeAccountId: account.homeAccountId,
            tenantId: account.tenantId,
            username: account.username,
        } as AccountInfo,
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
