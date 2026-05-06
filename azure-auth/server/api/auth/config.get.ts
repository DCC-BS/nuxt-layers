import { defineEventHandler } from "h3";
import { useRuntimeConfig } from "#imports";

interface MsalPublicConfig {
    tenantId: string;
    clientId: string;
    apiClientId: string;
}

export default defineEventHandler((): MsalPublicConfig => {
    const config = useRuntimeConfig().azureAuth;

    return {
        tenantId: config.tenantId,
        clientId: config.clientId,
        apiClientId: config.apiClientId,
    };
});
