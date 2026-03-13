import { createError, defineEventHandler, readBody, setCookie } from "h3";
import { SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import type { Session, SessionPayload } from "../../../app/types/session";

const SESSION_COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24;

interface LoginRequest {
    idToken: string;
    accessToken?: string;
}

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

async function verifyIdToken(
    idToken: string,
    config: ReturnType<typeof useRuntimeConfig>["azureAuth"],
): Promise<Record<string, unknown>> {
    const issuer = `https://login.microsoftonline.com/${config.tenantId}/v2.0`;

    const payload = decodeJwtPayload(idToken);
    if (!payload) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid token payload",
        });
    }

    if (payload.aud !== config.clientId) {
        throw createError({
            statusCode: 401,
            statusMessage: "Invalid audience",
        });
    }

    if (payload.iss !== issuer) {
        throw createError({ statusCode: 401, statusMessage: "Invalid issuer" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) {
        throw createError({ statusCode: 401, statusMessage: "Token expired" });
    }

    return payload;
}

export default defineEventHandler(async (event): Promise<Session> => {
    const body = await readBody<LoginRequest>(event);

    if (!body?.idToken) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing idToken",
        });
    }

    const config = useRuntimeConfig().azureAuth;

    const payload = await verifyIdToken(body.idToken, config);

    let apiAccessToken: string | undefined;
    let apiAccessTokenExpiresAt: number | undefined;

    if (body.accessToken) {
        apiAccessToken = body.accessToken;

        const decoded = decodeJwtPayload(body.accessToken);
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

    return {
        user: {
            id: sessionPayload.userId,
            email: sessionPayload.email,
            name: sessionPayload.name,
            roles: sessionPayload.roles,
        },
        apiAccessToken,
        apiAccessTokenExpiresAt,
        idToken: body.idToken,
    };
});
