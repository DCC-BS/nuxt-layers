import type { AuthSessionUser } from "#layers/auth/shared/types/session";

export interface AuthSession {
    user: AuthSessionUser;
    apiAccessToken?: string;
}
