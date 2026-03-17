import { defineEventHandler, getQuery, sendRedirect } from "h3";
import { getAuthConfig, getMsalClient } from "../../utils/msalClient";

export default defineEventHandler(async (event) => {
    const msalClient = getMsalClient();
    const authConfig = getAuthConfig();
    const query = getQuery(event);
    const scopes = getScopes();

    const authCodeUrlParameters = {
        scopes,
        redirectUri: authConfig.redirectUri,
        prompt: "select_account" as const,
        state: typeof query.redirect === "string" ? query.redirect : undefined,
    };

    const authUrl = await msalClient.getAuthCodeUrl(authCodeUrlParameters);

    return sendRedirect(event, authUrl);
});
