export default defineNitroPlugin(() => {
    const config = useRuntimeConfig();

    if (!config.apiUrl) {
        console.error(
            "BACKEND COMMUNICATION: API URL is not defined in runtime config.",
        );
    }
});
