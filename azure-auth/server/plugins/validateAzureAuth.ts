export default defineNitroPlugin(() => {
    const config = useRuntimeConfig();
    const auth_config = config.azureAuth;

    if (!auth_config.tenantId) {
        console.error(
            "AZURE AUTH: Tenant ID is missing. Set the environment variable NUXT_AZURE_AUTH_TENANT_ID",
        );
    }

    if (!auth_config.clientId) {
        console.error(
            "AZURE AUTH: Client ID is missing. Set the environment variable NUXT_AZURE_AUTH_CLIENT_ID",
        );
    }

    if (!auth_config.clientSecret) {
        console.error(
            "AZURE AUTH: Client Secret is missing. Set the environment variable NUXT_AZURE_AUTH_CLIENT_SECRET",
        );
    }

    if (!auth_config.apiClientId) {
        console.error(
            "AZURE AUTH: API Client ID is missing. Set the environment variable NUXT_AZURE_AUTH_API_CLIENT_ID",
        );
    }

    if (!auth_config.secret) {
        console.error(
            "AZURE AUTH: Auth Secret is missing. Set the environment variable NUXT_AZURE_AUTH_SECRET",
        );
    }

    if (!auth_config.origin) {
        console.error(
            "AZURE AUTH: Origin is missing. Set the environment variable NUXT_AZURE_AUTH_ORIGIN",
        );
    }
});
