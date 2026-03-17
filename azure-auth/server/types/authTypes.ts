import { z } from 'zod';
import { AccountInfo } from '@azure/msal-node';

export interface ExtendedSession extends AuthSession {
    error?: string;
}

export const tokenPayloadSchema = z.looseObject({
    // Object ID of the user in Azure AD. Stable tenant-wide identifier for the user. Same use + same tenant = same OID
    oid: z.string(),
    // subject identifier. Stable per client app and user. Same user + same client app = same sub
    sub: z.string(),
    // login name
    preferred_username: z.string().optional(),
    // Email address of the user
    email: z.string().optional(),
    // Human-readable name of the user
    name: z.string(),
    // Roles assigned to the user in Azure AD
    roles: z.array(z.string()).default([]),
    // Expiration time of the token as a Unix timestamp (seconds since epoch)
    exp: z.number(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export const authSessionPayloadSchema = z.object({
    userId: z.string(),
    email: z.string(),
    name: z.string(),
    roles: z.array(z.string()),
    apiAccessToken: z.string(),
    apiAccessTokenExpiresAt: z.number(),
    iat: z.number(),
    exp: z.number(),
    inMsTeams: z.boolean(),
    account: z.any(),
});

export type AuthSessionPayload = z.infer<typeof authSessionPayloadSchema> & { account: AccountInfo };

export interface AuthSession {
    user: AuthSessionUser;
    apiAccessToken?: string;
    // apiAccessTokenExpiresAt?: number;
    // idToken?: string;
    // refreshToken?: string;
}
