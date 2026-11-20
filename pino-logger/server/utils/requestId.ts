import { randomUUID } from "node:crypto";
import type { H3Event } from "h3";
import { getRequestHeader } from "h3";

// Accept the caller's id only when it looks like an id (UUIDs, ULIDs, ...),
// so a header can't put arbitrary text into every log line.
const REQUEST_ID_PATTERN = /^[A-Za-z0-9._-]{1,128}$/;

/**
 * The request id for this request: the incoming `X-Request-ID` header if it
 * is a plausible id, otherwise a new UUID.
 */
export function resolveRequestId(event: H3Event): string {
    const incoming = getRequestHeader(event, "x-request-id");
    if (incoming && REQUEST_ID_PATTERN.test(incoming)) {
        return incoming;
    }
    return randomUUID();
}
