import {
    createError,
    defineEventHandler,
    getCookie,
    readBody,
    setCookie,
} from "h3";
import { jwtVerify, SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";
import type { Session, SessionPayload } from "../../../app/types/session";

const SESSION_COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24;

interface RefreshTokenRequest {
    apiAccessToken: string;
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

export default defineEventHandler(async (event): Promise<Session> => {
    const body = await readBody<RefreshTokenRequest>(event);
    const cookie = getCookie(event, SESSION_COOKIE_NAME);

    if (!cookie) {
        throw createError({
            statusCode: 401,
            statusMessage: "No active session",
        });
    }

    if (!body?.apiAccessToken) {
        throw createError({
            statusCode: 400,
            statusMessage: "Missing apiAccessToken",
        });
    }

    const config = useRuntimeConfig();
    const secret = new TextEncoder().encode(config.azureAuth.secret);

    const { payload: existingPayload } = await jwtVerify<SessionPayload>(
        cookie,
        secret,
    );

    const decoded = decodeJwtPayload(body.apiAccessToken);
    if (!decoded) {
        throw createError({
            statusCode: 400,
            statusMessage: "Invalid access token",
        });
    }

    const updatedPayload: SessionPayload = {
        ...existingPayload,
        apiAccessToken: body.apiAccessToken,
        apiAccessTokenExpiresAt:
            typeof decoded.exp === "number"
                ? decoded.exp
                : Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
    };

    const token = await new SignJWT(updatedPayload)
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
            id: updatedPayload.userId,
            email: updatedPayload.email,
            name: updatedPayload.name,
            roles: updatedPayload.roles,
        },
        apiAccessToken: updatedPayload.apiAccessToken,
        apiAccessTokenExpiresAt: updatedPayload.apiAccessTokenExpiresAt,
    };
});
