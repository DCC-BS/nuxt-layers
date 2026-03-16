import { defineNuxtPlugin } from "#imports";

export default defineNuxtPlugin(async () => {
    const session = useState<AuthSession | null>(
        "auth:session",
        () => null,
    );

    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};

        const response =
            await $fetch<AuthSession>(
                "/api/auth/session",
                {
                    headers
                }
            );
        session.value = response;
    } catch {
        session.value = null;
    }
});
