import { defineNuxtPlugin, type AuthSessionUser } from "#imports";

export default defineNuxtPlugin(async () => {
    const session = useState<AuthSessionUser | undefined>(
        "auth:session",
        () => undefined,
    );

    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};

        const response = await $fetch<AuthSessionUser>("/api/auth/me", {
            headers,
        });

        session.value = response;
    } catch (e) {
        console.log("No active session found", e);
        session.value = undefined;
    }
});
