export interface AuthSessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: string[];
}

export interface AuthSession {
    user: AuthSessionUser;
    apiAccessToken?: string;
    apiAccessTokenExpiresAt?: number;
    idToken?: string;
    refreshToken?: string;
}

export interface AuthSessionPayload {
    userId: string;
    email: string;
    name: string;
    roles: string[];
    apiAccessToken?: string;
    apiAccessTokenExpiresAt?: number;
    refreshToken?: string;
    iat: number;
    exp: number;
    [key: string]: unknown;
}
