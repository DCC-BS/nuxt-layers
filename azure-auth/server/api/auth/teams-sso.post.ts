import { createError, defineEventHandler, readBody, setCookie } from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";

const SESSION_COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24;

interface TeamsSsoRequest {
    token: string;
}

export default defineEventHandler(async (event): Promise<AuthSession> => {
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

    const decoded = decodeJwtPayload(oboResponse.accessToken);
    if (!decoded) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid access token",
        });
    }

    const sessionPayload: AuthSessionPayload = {
        userId: (decoded.oid as string) || (decoded.sub as string) || "",
        email:
            (decoded.preferred_username as string) ||
            (decoded.email as string) ||
            "",
        name: (decoded.name as string) || "",
        roles: (decoded.roles as string[]) || [],
        apiAccessToken: oboResponse.accessToken,
        apiAccessTokenExpiresAt:
            typeof decoded.exp === "number"
                ? decoded.exp
                : Math.floor(Date.now() / 1000) + 3600,
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

    return {
        user: {
            id: sessionPayload.userId,
            email: sessionPayload.email,
            name: sessionPayload.name,
            roles: sessionPayload.roles,
        },
        apiAccessToken: oboResponse.accessToken,
        apiAccessTokenExpiresAt: sessionPayload.apiAccessTokenExpiresAt,
    };
});
