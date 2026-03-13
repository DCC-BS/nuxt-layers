export default defineNuxtRouteMiddleware(async (to) => {
    if (to.meta.public === true) return;

    if (process.client) {
        const inFrame = window.parent !== window;
        if (inFrame) {
            return;
        }
    }

    const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};
    const data = await $fetch<Session>("/api/auth/session", {
        headers,
    });

    if (data?.user) {
        return;
    }

    return navigateTo("/auth/signIn");
});
