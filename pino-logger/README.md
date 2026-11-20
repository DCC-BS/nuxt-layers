# Pino Logger

A Pino-based implementation of the Nuxt Logger Layer, providing fast and efficient logging for both browser and server environments.

## Documentation

For complete documentation, visit the [Pino Logger documentation](https://dcc-bs.github.io/documentation/nuxt-layers/).

## Server log format (production)

In production (`NODE_ENV=production`) both server-side loggers (SSR, `logger: "ssr"`, and Nitro, `logger: "api"`) write one JSON object per line to stdout, following the [DCC-BS logging contract](https://dcc-bs.github.io/documentation/coding/logging). The options live in `shared/utils/pinoOptions.ts`.

```text
{"level":"error","timestamp":"2026-11-20T09:53:56.768Z","app":"text-mate-frontend","logger":"api","request_id":"550e8400-e29b-41d4-a716-446655440000","event":"request_finished","method":"GET","path":"/api/items","status_code":500,"duration_s":0.0043,"message":"Failed request (500)"}
```

- `level` is `debug`, `info`, `warning`, `error` or `critical` (pino `trace` → `debug`, `warn` → `warning`, `fatal` → `critical`).
- `app` comes from `runtimeConfig.public.logger.app`; set `NUXT_PUBLIC_LOGGER_APP` (e.g. `text-mate-frontend`). Left out when empty.
- `request_id` is the incoming `X-Request-ID` header (if it looks like an id) or a new UUID. It is stored in `event.context.requestId`; the `backend_communication` layer forwards it to the backend as `X-Request-ID`.
- An `Error` passed to the logger (`logger.error(err, "msg")` or `{ err }` / `{ error }`) becomes `error` (message), `error_type` (name) and `exception` (stack; omitted when `includeStackTrace` is `false`).
- Nested objects and arrays in the log object are written as JSON strings. Log flat scalar fields instead.
- Warnings and errors carry the breadcrumb trail as a JSON string in `breadcrumbs`.
- The request middleware logs `event: "request_finished"` with `method`, `path` (no query string), `status_code` and `duration_s`: failed requests (status >= 400) at `error`, all others at `info` when `logAllRequests` is `true`.

In development the output goes through `pino-pretty` as before.
