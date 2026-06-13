# My Farm Game

An idle progression farm game built with Spring Boot, React, TypeScript, and SCSS.

Watch your farm tick. Collect gold. Repeat.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + SCSS (Vite) |
| Backend | Spring Boot 3.2 (Java 21) |
| Build Tools | Maven (backend), Vite + npm (frontend) |

## How to Run

**Frontend (development):**
```bash
cd frontend && npm run dev
# http://localhost:5173
```

**Backend:**
```bash
export JAVA_HOME=$(brew --prefix openjdk@21)
mvn spring-boot:run
# http://localhost:8080
```

## The Farm

### Game Assets

| Asset | Symbol | What It Does |
|---|---|---|
| Grass | ████░░ 80% | Grows over time, decays when sheared |
| Wool | ░░░░░░░░ 0% | Fills up → auto-shears → gold |
| Sheep | 🐑 | Lives on the farm (fixed count for now) |
| Gold | 🪙 0 | Currency, earns 5 per shearing |

### Core Loop

```
🌱 Grass grows → 🐑 Sheep produces 🧶 Wool → ✂️ Auto-shears → 🪙 +5 Gold
```

- **Grass bar** (green): Decays 10% every 5 minutes
- **Wool bar** (white): Fills 1% every second (~100s per cycle)
- **Auto-shear** when wool bar is full: resets to 0, gold increases by 5

All progression is automatic. No buttons. No persistence. Just watch it tick.

## Project Structure

```
server/   → Spring Boot (backend)
frontend/ → React + TypeScript + SCSS (Vite)
```

See `CLAUDE.md` for project conventions and `~/Coding/Knowledge/SpringBootLearning.md` for design decisions and learning notes.
