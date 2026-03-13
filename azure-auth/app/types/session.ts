export interface SessionUser {
    id: string;
    name: string;
    email: string;
    image?: string;
    roles: string[];
}

export interface Session {
    user: SessionUser;
    apiAccessToken?: string;
    apiAccessTokenExpiresAt?: number;
    idToken?: string;
}

export interface SessionPayload {
    userId: string;
    email: string;
    name: string;
    roles: string[];
    apiAccessToken?: string;
    apiAccessTokenExpiresAt?: number;
    iat: number;
    exp: number;
    [key: string]: unknown;
}
