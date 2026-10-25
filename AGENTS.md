# AGENTS.md

This file provides guidance for AI agents working on this Nuxt layers monorepo.

## Build/Lint Commands

### Available Commands
- `bunx biome check` - Run Biome linter to check code style and formatting issues
- `bunx biome check --write` - Auto-fix Biome issues

### Setup
- `mise run install` - install the root test harness and every layer (run from the repo root)

### Testing
- `mise run test` - unit tests (`tests/unit`) and the e2e suite (`tests/e2e`)
- `mise run ci` - what CI runs: biome in every layer, `nuxt prepare` per layer, all tests
- The e2e suite builds `tests/fixture`, an app that extends the layers from this checkout the way
  our apps do (auth + no-auth, backend_communication, health_check, logger + pino-logger,
  dcc-app-config, feedback-control), and calls it against a stub backend.
- `NUXT_LAYERS_LOCAL=true` makes nested layer references (auth → backend_communication → logger)
  resolve to this checkout instead of `github:DCC-BS/nuxt-layers/...`. Apps don't set it.

### Dependencies
- Apps install these layers with `install: true`, which runs `bun install` inside each layer. So a
  layer's `package.json` lists only what the layer needs at runtime:
  - packages every app already has (`@nuxt/ui`, `@nuxtjs/i18n`, `zod`, `pino`, `motion-v`,
    `@dcc-bs/communication.bs.js`) are **optional** `peerDependencies` with a major-version range,
    so the app's version is used and nothing is installed twice;
  - packages only the layer uses (`undici`, `@azure/msal-node`, ...) are `dependencies`;
  - dev tooling (nuxt, vue, typescript, vitest, ...) lives in the root `package.json` only.

## Code Style Guidelines

### Import Organization
- Biome automatically organizes imports on save (`source.organizeImports: "on"`)
- Import order: third-party, then local modules
- Use Nuxt's built-in aliases: `~/` (app), `~~/` (root), `~~/server` (server), `#shared` (shared)
- Example: `import { useUser } from '~/composables/useUser'`
- Aliases eliminate brittle relative paths and help Generative AI understand the project structure

### Formatting
- **Indentation**: 4 spaces, **Quotes**: Double quotes
- **Tool**: Biome (configured in biome.json)
- Run `bunx biome check --write` to format code before committing

### Type Annotations
- Use `type` for type-only imports: `import type { Ref } from "vue"`
- Use `interface` for object shapes, `type` for unions/primitives
- Enforce full TypeScript typing — no implicit `any`
- Use `never` for unreachable paths, `unknown` with validation for uncertain types
- Avoid inferrable types (Biome rule: `noInferrableTypes: error`)
- Use `as const` for literal types (Biome rule: `useAsConstAssertion: error`)
- Example error handling: `try { ... } catch (error: unknown) { if (error instanceof Error) console.error(error.message); }`

### Naming Conventions
- **Functions/Variables**: camelCase (`getAuthContext`)
- **Types/Interfaces**: PascalCase (`ExtendedSession`)
- **Components**: PascalCase (`UserProfileCard.vue`)
- **Pages**: kebab-case (`user-profile.vue`)
- **Server API**: kebab-case (`server/api/user-profile.ts`)
- **Other TS files**: camelCase (`utils/formatDate.ts`)
- **Composables**: Must start with `use` prefix (`useCounter`)

### Function Style
- Use standard function declarations for top-level definitions, avoid arrow functions unless necessary
- Named function declarations improve stack traces, readability, and hoisting behavior
- Example: `function formatName(name: string): string { return name.trim(); }`

### Vue Component Guidelines
- **Use Composition API exclusively** - No Options API (`data`, `methods`, `computed`)
- Use `<script setup lang="ts">` and `definePageMeta()` for metadata
- Prefer scoped styles: `<style scoped>`
- Biome disables unused variable checks for `.vue` files
- Example: `<script setup lang="ts"> const count = ref(0); function increment() { count.value++; } </script>`

### Styling
- Use Tailwind CSS for all styling
- Use Lucide icons from lucide.dev
- Example: `<div class="flex items-center gap-2 px-4 py-2"><UButton icon="i-lucide-plus">Add Item</UButton></div>`

### Error Handling
- Use H3's `createError()` with `statusCode`, `statusMessage`, and `message`
- Example: `throw createError({ statusCode: 401, statusMessage: "Unauthorized", message: "You must be logged in to access this resource." })`

### Linter Rules (Biome)
Enforced rules: `noParameterAssign`, `useDefaultParameterLast`, `useSingleVarDeclarator`, `noUnusedTemplateLiteral`, `noInferrableTypes`, `noUselessElse`, `useEnumInitializers`, `useSelfClosingElements` (all at error level)

### Composables
- Place in `app/composables/`, name starting with `use`
- Each composable should expose a main `use*` function that handles logic
- Return objects for reactive state
- Don't create composables for Vue-independent logic - put those in `/utils` or `/services` instead
- Example: `export function useCounter() { const count = ref(0); function increment() { count.value++; } return { count, increment }; }`

### Utilities and Services
- Keep framework-agnostic functions in `/utils`
- Use `/services` for API/business logic that's auto-import–independent
- Example utils: `export function formatDate(date: Date) { return date.toISOString().split("T"); }`
- Example services: `export async function fetchUser(id: string) { return await $fetch(`/api/user/${id}`); }`

### Server-Side Code
- API routes follow pattern: `server/api/[endpoint].[method].ts`
- Use `defineEventHandler()` for handlers
- Access logger via `event.context.logger` when logger layer is used
- Use Nitro plugins in `server/plugins/` for global server initialization
- Use `server/middleware/` for middleware

### Runtime Config
- Define in `runtimeConfig` section of `nuxt.config.ts`
- Public config available on client: `useRuntimeConfig().public.*`
- Private config only on server: `useRuntimeConfig().private.*`

### Layer Structure
Each layer: `nuxt.config.ts`, `app/` (composables, components, pages, utils, services, types), `server/` (api, plugins, utils, middleware), `shared/types/`, `.playground/`
Structure: `app/components/`, `app/composables/`, `app/pages/`, `app/utils/`, `app/services/`, `app/types/`, `server/api/`, `server/plugins/`, `server/middleware/`, `shared/types/`

### Git Ignore Patterns
`node_modules/`, `.nuxt/`, `.output/`, `.env*`, `logs/`, `dist/`, `out/`

## Running a Single Layer

To develop on a specific layer:
1. Navigate to layer directory: `cd auth`
2. Run dev server: `bun run dev` (if configured)
3. Or use playground: `cd .playground && bun run dev`
