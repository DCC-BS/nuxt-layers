import { defineEventHandler, getCookie } from "h3";
import { jwtVerify } from "jose";
import { useRuntimeConfig } from "#imports";
import type { Session, SessionPayload } from "../../../app/types/session";

const SESSION_COOKIE_NAME = "auth_session";

export default defineEventHandler(async (event): Promise<Session | null> => {
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
});
