import type { AuthData } from "#layers/auth/app/types/authData";
import type { UseAppAuthReturns } from "#layers/auth/app/types/composableTypes";

export function useAppAuth(): UseAppAuthReturns {
    const session = useState<AuthSessionUser>("auth:session", () => ({
        id: "",
        name: "",
        email: "",
        image: "",
        roles: [],
        inMsTeams: false,
    }));

    const data = computed<AuthData>(() => {
        return {
            user: {
                image: session.value.image ?? "",
                name: session.value.name,
                email: session.value.email,
            },
        };
    });

    async function signOut(): Promise<void> {
        // No authentication available in this layer
    }

    async function signIn(): Promise<void> {
        // No authentication available in this layer
    }

    return {
        signIn,
        signOut,
        data,
        isAuthEnabled: computed(() => false),
        inMsTeams: computed(() => session.value.inMsTeams),
    };
}
