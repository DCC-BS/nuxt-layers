export default defineNitroPlugin(() => {

    const config = useRuntimeConfig();

    if (!config.auth.azureAdTenantId) {
        console.error(
            "AZURE AUTH: Azure AD Tenant ID is not defined in runtime config.",
        );
    }

    if (!config.auth.azureAdClientId) {
        console.error(
            "AZURE AUTH: Azure AD Client ID is not defined in runtime config.",
        );
    }

    if (!config.auth.azureAdClientSecret) {
        console.error(
            "AZURE AUTH: Azure AD Client Secret is not defined in runtime config.",
        );
    }

    if (!config.auth.azureAdAPIClientId) {
        console.error(
            "AZURE AUTH: Azure AD API Client ID is not defined in runtime config.",
        );
    }

    if (!config.auth.authSecret) {
        console.error(
            "AZURE AUTH: Auth Secret is not defined in runtime config.",
        );
    }

    if (!process.env.AUTH_ORIGIN) {
        console.error(
            "AZURE AUTH: AUTH_ORIGIN environment variable is not defined.",
        );
    }
});
