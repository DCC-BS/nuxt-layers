import { createError, defineEventHandler, readBody, setCookie } from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import type { AuthSessionUser } from "#layers/azure-auth/shared/types/session";
import { authSessionPayloadSchema } from "../../types/authTypes";
import {
    COOKIE_MAX_AGE,
    MS_TEAMS_FLAG_COOKIE_NAME,
    SESSION_COOKIE_NAME,
} from "../../utils/authUtils";

interface TeamsSsoRequest {
    token: string;
}

export default defineEventHandler(async (event) => {
    const body = await readBody<TeamsSsoRequest>(event);

    if (!body?.token) {
        throw createError({ statusCode: 400, statusMessage: "Missing token" });
    }

    const config = useRuntimeConfig().azureAuth;
    const msalClient = getMsalClient();

    const oboResponse = await msalClient.acquireTokenOnBehalfOf({
        oboAssertion: body.token,
        scopes: [`api://${config.apiClientId}/user_impersonation`],
    });

    if (!oboResponse?.accessToken) {
        throw createError({
            statusCode: 401,
            statusMessage: "Failed to exchange token via OBO flow",
        });
    }

    if (!oboResponse.account) {
        throw createError({
            statusCode: 401,
            statusMessage:
                "Failed to retrieve account information from OBO response",
        });
    }

    const decoded = decodeJwtPayload(oboResponse.accessToken);
    if (!decoded) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid access token",
        });
    }

    const sessionPayload = authSessionPayloadSchema.parse({
        userId: (decoded.oid as string) || (decoded.sub as string) || "",
        email:
            (decoded.preferred_username as string) ||
            (decoded.email as string) ||
            "",
        name: (decoded.name as string) || "",
        roles: (decoded.roles as string[]) || [],
        account: oboResponse.account,
        inMsTeams: true,
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
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });

    setCookie(event, MS_TEAMS_FLAG_COOKIE_NAME, "true", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: COOKIE_MAX_AGE,
    });

    return {
        id: sessionPayload.userId,
        email: sessionPayload.email,
        name: sessionPayload.name,
        roles: sessionPayload.roles,
    } as AuthSessionUser;
});
