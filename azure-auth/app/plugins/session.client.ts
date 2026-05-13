import { type AuthSessionUser, defineNuxtPlugin } from "#imports";

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
    } catch {
        session.value = undefined;
    }
});
