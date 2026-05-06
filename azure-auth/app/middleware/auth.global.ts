export default defineNuxtRouteMiddleware(async (to) => {
    if (to.meta.public === true) return;

    const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};

    try {
        const data = await $fetch("/api/auth/me", {
            headers,
        });

        if (data) {
            return;
        }
    } catch {}

    return navigateTo("/auth/signIn");
});
