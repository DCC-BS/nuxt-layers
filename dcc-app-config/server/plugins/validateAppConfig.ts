export default defineNitroPlugin(() => {
    const { appListUrlTemplate } = useRuntimeConfig().public.appConfig;

    if (!appListUrlTemplate) {
        console.error(
            "DCC APP CONFIG: `appListUrlTemplate` is not defined. Set it in your runtime config or via the `NUXT_PUBLIC_APP_CONFIG_APP_LIST_URL_TEMPLATE` environment variable.",
        );
    }
});
