# CLAUDE.md

This project is a learning project for Spring Boot microservices, targeting a beginner learning Java 21.

## Vision
- **Monorepo style**: Multiple Spring Boot services in one repo
- **Phase 1 (current)**: Landing page + product browsing (`hello-world` app)
- **Phase 2**: Users service (signup, login, auth)
- **Phase 3+**: Payment, orders, etc. as needed
- Each service runs on its own port (no gateway yet)
- Landing page is served by the products service, NOT a standalone service

## Current Stack
- Java 21, Spring Boot 3.2.0, Maven (`pom.xml`)
- `spring-boot-starter-web` + `spring-boot-devtools`
- React 18 + TypeScript + Vite + SCSS
- Vitest (unit tests)

## Current Project Structure (monorepo)
```
pom.xml                          # Maven build (server sources + resources)
server/
  src/main/java/com/example/helloworld/
    HelloWorldApplication.java     # Spring Boot entry point
    HelloRestController.java       # GET /api/hello → {"message":"..."}
    IndexController.java           # Forward / → index.html (SPA)
server/src/main/resources/
  application.properties
  static/                          # Built frontend copied here (index.html + assets/)
frontend/
  package.json                     # Dependencies + scripts (build, test, dev)
  vite.config.ts                   # Vite config (React plugin, dev proxy)
  frontend/src/
    App.tsx                        # Single React component (UI + game loops)
    gameLogic.ts                   # Pure game state functions (no React, testable)
    gameLogic.test.ts              # 23 unit tests (Vitest)
    App.scss                       # Farm UI styles
    index.scss                     # Global styles
```

## Run Test
When the user says "test":
1. `cd frontend && npm test`
   - Runs Vitest: `vitest run`
   - Must pass all 23 tests before deploying

## Deploy
When the user says "deploy" (and tests pass):
1. `cd frontend && npm run build`
   - `tsc -b && vite build` → outputs to `frontend/dist/`
2. `cp -Rf frontend/dist/* server/src/main/resources/static/`
   - Replaces static files with fresh build
3. Kill any existing server on port 8080 (`lsof -i :8080 | awk '{print $2}'`)
4. `mvn spring-boot:run`
   - Starts Spring Boot on port 8080
   - Serve built frontend from `static/` + proxy API calls

## Project History (from brainstorming)
See ~/Coding/Knowledge/SpringBootLearning.md for full design decisions and frontend/backend choices.

## Farm Game Mechanics
**State:** `{ grass: 0-100, wool: 0-100, gold: number, sheep: number, autoBuySheep: boolean }`
- **Grass decay:** `10 + max(0, sheep - 1) * 5` per 5-minute tick. When grass hits 0, it resets to 100 (cyclical renewal).
- **Wool growth:** `sheep %` per second. When wool reaches 100, it triggers a shear: wool resets to 0, gold increases by `5 * sheep`.
- **Buy sheep:** costs 15 gold. Each sheep increases wool growth rate (+sheep %/sec) and grass decay (+5%/tick per extra sheep beyond 1).
- **Auto-buy:** On/off toggle next to the buy button. When ON, the game watches `state.gold` — whenever gold increases (from woolShear) and reaches 15+, a sheep is purchased immediately. When OFF, manual buying is re-enabled. The auto-buy ref is reset to 0 when toggled off.
- **Edge:** First sheep costs 0 gold (starts at 10). Grass cycle at 1 sheep = ~50 min; at 5 sheep = ~15 min.
