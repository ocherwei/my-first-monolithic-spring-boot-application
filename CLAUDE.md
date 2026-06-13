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
- Plain HTML + CSS (no React, no SCSS, no build tools)

## Current Project Structure
```
src/main/java/com/example/helloworld/
  HelloWorldApplication.java
  HelloController.java
src/main/resources/
  application.properties
  (static/ for HTML, css/ for styles — to be added in Phase 1)
```

## Project History (from brainstorming)
See ~/Coding/Knowledge/SpringBootLearning.md for full design decisions and frontend/backend choices.
