# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a fork of the Directus Template CLI that adds REST API functionality. It provides both a CLI (using oclif) and an Express API server for applying and extracting Directus templates.

## Build & Development Commands

```bash
pnpm install          # Install dependencies
pnpm run build        # Build TypeScript to dist/
pnpm run lint         # Run ESLint
pnpm test             # Run tests with Mocha
pnpm start            # Start API server (port 3000, or PORT env var)
pnpm run api          # Alias for starting API server
./bin/run.js          # Run CLI commands directly
```

## Architecture

### Entry Points
- **CLI**: `bin/run.js` → oclif commands in `src/commands/`
- **API**: `bin/api-server.js` → `src/api/server.ts`

### Core Structure
```
src/
├── api/           # Express API server
│   ├── server.ts  # Express app setup, routes, middleware
│   ├── handlers.ts # API endpoint handlers (wrap CLI logic)
│   └── middleware/auth.ts # Optional token auth (API_AUTH_TOKEN env)
├── commands/      # oclif CLI commands
│   ├── base.ts    # Base command class with telemetry/config
│   ├── apply.ts   # Apply template command
│   ├── extract.ts # Extract template command
│   └── init.ts    # Initialize new project command
├── lib/
│   ├── load/      # Template application logic
│   │   ├── index.ts # Main apply() orchestrator
│   │   └── load-*.ts # Individual loaders (collections, roles, files, etc.)
│   ├── extract/   # Template extraction logic
│   │   ├── index.ts # Main extract() orchestrator
│   │   └── extract-*.ts # Individual extractors
│   ├── init/      # Project initialization logic
│   ├── sdk.ts     # Directus SDK wrapper with rate limiting (Bottleneck)
│   └── utils/     # Shared utilities (logger, auth, template helpers)
└── services/      # External services (GitHub, PostHog telemetry)
```

### Key Design Patterns

1. **Shared Business Logic**: Both CLI and API use the same `src/lib/load/` and `src/lib/extract/` modules. The API handlers in `src/api/handlers.ts` wrap these functions.

2. **Rate Limiting**: The `api` singleton in `src/lib/sdk.ts` uses Bottleneck to rate-limit Directus API calls (10 concurrent, 50 req/sec reservoir).

3. **Template Structure**: Extracted templates go to `{dir}/src/` containing JSON files for collections, fields, relations, permissions, etc.

4. **Apply Flags**: Apply operations support partial application via flags (`schema`, `permissions`, `content`, `files`, `flows`, `dashboards`, `settings`, `extensions`, `users`).

## Testing

```bash
pnpm test                           # Run all tests
pnpm test -- --grep "pattern"       # Run tests matching pattern
pnpm test -- test/commands/apply.test.ts  # Run specific test file
```

Tests use Mocha and Chai, located in `test/`.

## Environment Variables

- `PORT` - API server port (default: 3000)
- `API_AUTH_TOKEN` - Enable API authentication when set
- `DIRECTUS_URL`, `DIRECTUS_TOKEN` - Default Directus connection
