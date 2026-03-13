import { defineEventHandler, sendRedirect } from "h3";

export default defineEventHandler(async (event) => {
    const authConfig = getAuthConfig();

    const logoutUrl = new URL(
        `https://login.microsoftonline.com/${authConfig.tenantId}/oauth2/v2.0/logout`,
    );
    logoutUrl.searchParams.set(
        "post_logout_redirect_uri",
        authConfig.redirectUri.replace("/api/auth/callback/azure-ad", ""),
    );

    return sendRedirect(event, logoutUrl.toString());
});
