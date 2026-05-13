import type { AuthData } from "#layers/auth/app/types/authData";
import type { UseAppAuthReturns } from "#layers/auth/app/types/composableTypes";

const sessionKey = "auth:session";

export function useAppAuth(): UseAppAuthReturns {
    const user = useState<AuthSessionUser | undefined>(
        sessionKey,
        () => undefined,
    );

    const data = computed<AuthData | undefined>(() => {
        if (!user.value) {
            return undefined;
        }

        return {
            user: {
                image: user.value?.image ?? "",
                name: user.value?.name ?? "",
                email: user.value?.email ?? "",
            },
        };
    });

    const isAuthEnabled = computed(() => !!user.value);

    async function clearServerSession(): Promise<void> {
        try {
            await $fetch("/api/auth/logout", {
                method: "POST",
            });
        } catch {
            // Ignore errors during logout
        }
        user.value = undefined;
    }

    async function signIn(): Promise<void> {
        await navigateTo("/api/auth/authorize", { external: true });
    }

    async function signOut(): Promise<void> {
        await clearServerSession();
        await navigateTo("/api/auth/logout/azure-ad", { external: true });
    }

    return {
        signIn,
        signOut,
        data: readonly(data) as Readonly<Ref<AuthData | null>>,
        isAuthEnabled: readonly(isAuthEnabled) as Readonly<Ref<boolean>>,
    };
}
