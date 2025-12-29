import type { AuthData } from '#layers/auth/app/types/authData';
import type { UseAppAuthReturns } from '#layers/auth/app/types/composableTypes';

export function useAppAuth(): UseAppAuthReturns {
    const data = computed<AuthData>(() => {
        return {
            user: {
                image: '',
                name: '',
                email: '',
            }
        }
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
    };
}
