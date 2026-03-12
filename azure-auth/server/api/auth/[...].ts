import AzureAD from "next-auth/providers/azure-ad";
import Credentials from "next-auth/providers/credentials";
import { NuxtAuthHandler } from "#auth";
import { useRuntimeConfig } from "#imports";
import type { ExtendedJWT, ExtendedSession } from "../../types/authTypes";

async function exchangeTeamsTokenForApiToken(teamsToken: string) {
    const config = useRuntimeConfig().azureAuth;

    const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        requested_token_use: "on_behalf_of",
        assertion: teamsToken,
        scope: `api://${config.apiClientId}/user_impersonation`,
    } as Record<string, string>);

    const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;

    const resp = await $fetch<{
        access_token: string;
        id_token: string;
        expires_in: number;
    }>(url, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
    });

    if (!resp.access_token) {
        throw new Error("SSO token invalid");
    }

    return resp;
}

// Helper function to decode JWT without verification (for reading claims)
function decodeJWT(token: string) {
    try {
        const base64Url = token.split(".")[1];

        if (!base64Url) {
            throw new Error("Invalid JWT token");
        }

        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split("")
                .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                .join(""),
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error("Error decoding JWT:", error);
        return null;
    }
}

async function getApiAccessToken(refreshToken: unknown) {
    const config = useRuntimeConfig().azureAuth;
    const url = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        scope: `api://${config.apiClientId}/user_impersonation`,
    } as Record<string, string>);
    const response = await $fetch<{ access_token: string | undefined }>(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body,
        timeout: 10000,
    });

    if (!response.access_token) {
        throw new Error("Failed to get API access token");
    }
    return response.access_token;
}

export default NuxtAuthHandler({
    secret: useRuntimeConfig().azureAuth.secret,
    pages: {
        signIn: "/auth/signin",
    },
    providers: [
        // @ts-ignore
        AzureAD.default({
            clientId: useRuntimeConfig().azureAuth.clientId,
            clientSecret: useRuntimeConfig().azureAuth.clientSecret,
            tenantId: useRuntimeConfig().azureAuth.tenantId,
            authorization: {
                params: {
                    scope: "openid profile email offline_access User.Read",
                },
            },
        }),
        Credentials.default({
            id: "teams",
            name: "Microsoft Teams SSO",
            credentials: {
              token: { label: "Token", type: "text" },
            },
            async authorize(credentials: { token?: string }) {
              if (!credentials?.token) return null;

              // OBO: validate the Teams token and get an API access token
              const oboResult = await exchangeTeamsTokenForApiToken(credentials.token);
              const decoded = decodeJWT(oboResult.access_token);

              if (!decoded) return null;

              // Map decoded claims to a user object for the session
              return {
                id: decoded.oid ?? decoded.sub,
                name: decoded.name,
                email: decoded.preferred_username ?? decoded.email,
                roles: decoded.roles ?? [],
                apiAccessToken: oboResult.access_token,
              };
            },
        })
    ],
    callbacks: {
        async jwt({ token, account }) {
            const extendedToken = token;
            if (account) {
                extendedToken.accessToken = account.access_token;
                extendedToken.refreshToken = account.refresh_token;
                // ID Token for client side checks
                extendedToken.idToken = account.id_token;
            }
            return extendedToken;
        },
        async session({ session, token }) {
            const extendedToken = token as ExtendedJWT;
            const extendedSession = session as ExtendedSession;

            extendedSession.idToken = extendedToken.idToken;

            // Check if we need to refresh the API access token
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            const tokenExpired =
                !extendedSession.apiAccessTokenExpiresAt ||
                extendedSession.apiAccessTokenExpiresAt <= currentTimeInSeconds;

            if (!extendedSession.apiAccessToken || tokenExpired) {
                extendedSession.apiAccessToken = await getApiAccessToken(
                    token.refreshToken,
                );
                const decoded = decodeJWT(extendedSession.apiAccessToken);
                extendedSession.apiAccessTokenExpiresAt = decoded.exp;

                if (!extendedSession.user) {
                    extendedSession.user = {
                        email: "",
                        name: "",
                        image: "",
                        roles: [],
                    };
                }

                extendedSession.user.roles = decoded.roles;
            }
            return session;
        },
    },
});
