import { defineNuxtPlugin } from "#imports";
import type { Session } from "../types/session";

export default defineNuxtPlugin(async () => {
    const session = useState<Session | null>(
        "auth:session",
        () => null,
    );

    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};

        const response =
            await $fetch<Session>(
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
