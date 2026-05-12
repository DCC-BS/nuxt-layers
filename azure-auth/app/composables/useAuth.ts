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
        console.log(
            "[useAuth] signIn: about to navigateTo /api/auth/authorize",
        );
        try {
            await navigateTo("/api/auth/authorize", { external: true });
            console.log(
                "[useAuth] signIn: navigateTo returned (should not reach here for external)",
            );
        } catch (e) {
            console.error("[useAuth] signIn: navigateTo threw:", e);
            throw e;
        }
    }

    async function signOut(): Promise<void> {
        await clearServerSession();
        console.log(
            "[useAuth] signOut: about to navigateTo /api/auth/logout/azure-ad",
        );
        try {
            await navigateTo("/api/auth/logout/azure-ad", { external: true });
            console.log("[useAuth] signOut: navigateTo returned");
        } catch (e) {
            console.error("[useAuth] signOut: navigateTo threw:", e);
            throw e;
        }
    }

    return {
        signIn,
        signOut,
        data: readonly(data) as Readonly<Ref<AuthData | null>>,
        isAuthEnabled: readonly(isAuthEnabled) as Readonly<Ref<boolean>>,
    };
}
