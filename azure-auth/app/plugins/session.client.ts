import { defineNuxtPlugin } from "#imports";

export default defineNuxtPlugin(async () => {
    const session = useState<AuthSession | undefined>(
        "auth:session",
        () => undefined,
    );

    try {
        const headers = import.meta.server ? useRequestHeaders(["cookie"]) : {};

        const response = await $fetch<AuthSession>("/api/auth/session", {
            headers,
        });
        session.value = response;
        session.value.user.image = await getImage();
    } catch (e) {
        console.log("No active session found", e);
        session.value = undefined;
    }
});

async function getImage() {
    try {
        const response = await fetch("/api/auth/user/image");
        if (response.ok) {
            const blob = await response.blob();
            return URL.createObjectURL(blob);
        }
    } catch (error) {
        console.error("Error fetching user image:", error);
        return undefined;
    }
}
