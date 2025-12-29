import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

/**
 * Extended session type that may include error information for token refresh failures
 */
export interface ExtendedSession extends Session {
    error?: string;
    idToken?: string;
    user: Session["user"] & { roles: string[] };
    apiAccessTokenExpiresAt?: number;
    apiAccessToken?: string;
}

/**
 * Extended JWT type that includes optional idToken for backend authentication
 */
export interface ExtendedJWT extends JWT {
    idToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    provider?: string;
}
