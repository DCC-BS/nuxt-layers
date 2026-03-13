import type { Session, SessionPayload } from "../../app/types/session";

export interface ExtendedSession extends Session {
    error?: string;
}

export type { Session, SessionPayload };
