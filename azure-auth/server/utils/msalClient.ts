import { ConfidentialClientApplication } from "@azure/msal-node";
import { useRuntimeConfig } from "#imports";

let msalClient: ConfidentialClientApplication | null = null;

export function getMsalClient(): ConfidentialClientApplication {
    if (msalClient) {
        return msalClient;
    }

    const config = useRuntimeConfig().azureAuth;

    msalClient = new ConfidentialClientApplication({
        auth: {
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            authority: `https://login.microsoftonline.com/${config.tenantId}`,
        },
    });

    return msalClient;
}

export function getAuthConfig() {
    const config = useRuntimeConfig().azureAuth;
    return {
        clientId: config.clientId,
        tenantId: config.tenantId,
        apiClientId: config.apiClientId,
        redirectUri: `${config.origin}/callback/azure-ad`,
    };
}
