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
package.json                     # Frontend deps + scripts (build, test, dev)
vite.config.ts                   # Vite config (React plugin, dev proxy)
frontend/
  src/
    App.tsx                      # React component (UI + game loops)
    main.tsx                     # Entry point
    gameLogic.ts                 # Pure game state functions (no React, testable)
    gameLogic.test.ts            # 43 unit tests (Vitest)
    App.scss                     # Farm UI styles
  node_modules/
server/
  src/main/java/com/example/helloworld/
    HelloWorldApplication.java     # Spring Boot entry point
    HelloRestController.java       # GET /api/hello → {"message":"..."}
    IndexController.java           # Forward / → index.html (SPA)
server/src/main/resources/
  application.properties
  static/                          # Built frontend copied here (index.html + assets/)
```

## Run Test
When the user says "test":
1. `cd frontend && npm test`
   - Runs Vitest: `vitest run`
   - Must pass all 43 tests before deploying

## Deploy
When the user says "deploy" (and tests pass):
1. User runs: `npm run build`
   - `tsc -b && vite build` → outputs to `./dist/` (project root)
2. From project root: `cp -Rf dist/* server/src/main/resources/static/`
   - Copies built files into Spring Boot's static directory
3. Kill any existing server on port 8080: `lsof -i :8080 | awk '{print $2}' | xargs -r kill`
4. `mvn spring-boot:run`
   - Starts Spring Boot on port 8080
   - Serve built frontend from `static/` + proxy API calls

## Project History (from brainstorming)
See ~/Coding/Knowledge/SpringBootLearning.md for full design decisions and frontend/backend choices.

## Farm Game Mechanics
**State:** `{ grass: 0-100, hay: 0-100, wool: 0-100, gold: number, sheep: number, autoBuySheep: boolean, deathCounter: number }`
- **Grass/tick:** 2.5 minutes (was 5 min). Regenerates 9% per tick, sheep consume 3% each per tick.
- **3-phase grass system:**
  1. **Grass phase:** When grass > 0, sheep eat 3% per sheep. Grass regenerates 9% after consumption. If grass ≥ 100 after regen, excess overflows to hay.
  2. **Hay phase:** When grass = 0, sheep consume 5% per sheep per tick from hay (stored in silo).
  3. **Death phase:** When both grass = 0 and hay = 0, 1 sheep dies every 3 ticks (7.5 minutes).
- **Hay overflow:** When grass ≥ 100 after sheep eat + regen, excess over 100 goes to hay (capped at 100).
- **Wool growth:** `sheep %` per second. When wool reaches 100, it triggers a shear: wool resets to 0, gold increases by `5 * sheep`.
- **Buy sheep:** costs 15 gold. Each sheep increases wool growth rate (+sheep %/sec) and grass consumption (+3%/tick per sheep).
- **Auto-buy:** On/off toggle next to the buy button. When ON, the game watches `state.gold` — whenever gold increases (from woolShear) and reaches 15+, a sheep is purchased immediately. When OFF, manual buying is re-enabled. The auto-buy ref is reset to 0 when toggled off.
- **Edge:** Starts with 1 sheep, gold: 10. Grass never auto-regenerates to 100 (no cyclical reset) — once depleted, the hay/silo chain begins.

### Lifecycle with Option B (3% per sheep consumption, 9% regen)
| Sheep | Net grass change/tick | Hay production | Time to deplete from 100 |
|-------|----------------------|---------------|------------------------|
| 0 | +3% (fills to 100) | 9%/tick (full silo ~2h) | Prep time ~2h 45m |
| 1 | +6% (when at 100) | 6%/tick (full silo ~17m) | Buffer ~3h |
| 2 | +3% (when at 100) | 3%/tick (full silo ~33m) | Buffer ~2h |
| 3 | 0% (break-even) | 0% (full silo not possible) | Buffer ~0, hay drains when grass=0 |
| 5 | -3% (depletes fast) | None | Buffer ~40m (hay 5%/sheep/tick) |
