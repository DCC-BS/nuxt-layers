import { defineEventHandler, getCookie, setCookie } from "h3";
import { jwtVerify, SignJWT } from "jose";
import { useRuntimeConfig } from "#imports";

const SESSION_COOKIE_NAME = "auth_session";
const COOKIE_MAX_AGE = 60 * 60 * 24;

export default defineEventHandler(async (event): Promise<AuthSession | null> => {
    const cookie = getCookie(event, SESSION_COOKIE_NAME);

    if (!cookie) {
        console.log("No session cookie found");
        return null;
    }

    try {
        const config = useRuntimeConfig();
        const secret = new TextEncoder().encode(config.azureAuth.secret);

        const { payload } = await jwtVerify<AuthSessionPayload>(cookie, secret);

        let apiAccessToken = payload.apiAccessToken;
        let apiAccessTokenExpiresAt = payload.apiAccessTokenExpiresAt;
        let refreshToken = payload.refreshToken;

        if (isTokenExpired(apiAccessTokenExpiresAt) && refreshToken) {
            const refreshed = await refreshAccessToken(refreshToken);

            if (refreshed) {
                apiAccessToken = refreshed.accessToken;
                apiAccessTokenExpiresAt = refreshed.expiresAt;
                if (refreshed.refreshToken) {
                    refreshToken = refreshed.refreshToken;
                }

                const updatedPayload: AuthSessionPayload = {
                    ...payload,
                    apiAccessToken,
                    apiAccessTokenExpiresAt,
                    refreshToken,
                    iat: Math.floor(Date.now() / 1000),
                    exp: Math.floor(Date.now() / 1000) + COOKIE_MAX_AGE,
                };

                const newToken = await new SignJWT(updatedPayload)
                    .setProtectedHeader({ alg: "HS256" })
                    .setIssuedAt()
                    .setExpirationTime(`${COOKIE_MAX_AGE}s`)
                    .sign(secret);

                setCookie(event, SESSION_COOKIE_NAME, newToken, {
                    httpOnly: true,
                    secure: true,
                    sameSite: "lax",
                    path: "/",
                    maxAge: COOKIE_MAX_AGE,
                });
            }
        }

        return {
            user: {
                id: payload.userId,
                email: payload.email,
                name: payload.name,
                roles: payload.roles,
            },
            apiAccessToken,
            apiAccessTokenExpiresAt,
        };
    } catch {
        return null;
    }
});
