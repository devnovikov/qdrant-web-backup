# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**qdrant-web-backup** is a web application providing a UI for managing Qdrant vector database backups.

## Technology Stack

### Frontend
| Technology | Version | Notes |
|------------|---------|-------|
| React | 19.x | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool |
| TailwindCSS | 4.x | Styling |
| React Query | 5.x | Data fetching |
| MSW | 2.x | Mock Service Worker for testing |
| Playwright | 1.52.x | E2E testing |
| Vitest | 4.x | Unit testing |

### Backend
| Technology | Version | Notes |
|------------|---------|-------|
| Kotlin | 2.3.0 | Language |
| JDK | **25** | Java version (EA) |
| Gradle | **9.2.1** | Build tool |
| Spring Boot | 4.1.0-SNAPSHOT | Framework |
| Exposed ORM | 0.57.0 | Database ORM |
| H2 | - | Dev database |
| PostgreSQL | - | Prod database |

## Project Structure

```
qdrant-web-backup/
├── backend/           # Kotlin/Spring Boot API server
│   ├── src/main/kotlin/com/qdrant/backup/
│   └── build.gradle.kts
├── frontend/          # React/TypeScript web application
│   ├── src/
│   ├── e2e/           # Playwright E2E tests
│   └── package.json
├── Dockerfile         # Multi-stage: frontend + backend in one container
├── docker-compose.yml # Full stack orchestration (app + postgres + qdrant)
├── nginx.conf         # Nginx config for static files + API proxy
├── supervisord.conf   # Process manager for nginx + java
├── entrypoint.sh      # Container entrypoint script
└── .github/workflows/ # CI/CD pipelines
```

## Development Commands

### Frontend
```bash
cd frontend

# Install dependencies
npm install

# Development server (with MSW mocks enabled by default)
npm run dev

# Development server (without mocks, real backend)
VITE_MOCK_ENABLED=false npm run dev

# Run unit tests
npm run test:run

# Run E2E tests
npm run test:e2e

# Build for production
npm run build

# Lint
npm run lint
```

### Backend
```bash
cd backend

# Run development server
./gradlew bootRun

# Run all tests
./gradlew test

# Run unit tests only
./gradlew unitTest

# Run integration tests only
./gradlew integrationTest

# Build JAR
./gradlew bootJar

# Build without tests
./gradlew bootJar -x test
```

### Docker
```bash
# Build and run all services
docker-compose up --build

# Run in detached mode
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

## Environment Variables

### Frontend (.env)
| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_MOCK_ENABLED` | `true` | Enable MSW mocks (`true`/`false`) |
| `VITE_API_URL` | (empty) | API URL for production |

### Backend (application.yml / env)
| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_PROFILES_ACTIVE` | `dev` | Active profile (`dev`/`prod`) |
| `QDRANT_HOST` | `localhost` | Qdrant server host |
| `QDRANT_PORT` | `6333` | Qdrant server port |
| `QDRANT_API_KEY` | (empty) | Qdrant API key |
| `DATABASE_URL` | - | PostgreSQL URL (prod) |
| `DATABASE_USER` | `qdrant` | Database username |
| `DATABASE_PASSWORD` | - | Database password |
| `STORAGE_PATH` | `./data/snapshots` | Snapshot storage path |

## API Documentation

- OpenAPI spec: `http://localhost:8080/api-docs`
- Swagger UI: `http://localhost:8080/swagger-ui.html`

## Testing

### Frontend Testing
- **Unit tests**: Vitest with MSW mocks
- **E2E tests**: Playwright with MSW mocks (3 browsers: Chromium, Firefox, WebKit)
- **Mock toggle**: `VITE_MOCK_ENABLED=false` to test against real backend

### Backend Testing
- **Unit tests**: JUnit 5 + MockK (tagged with `@Tag("unit")`)
- **Integration tests**: Testcontainers for PostgreSQL (tagged with `@Tag("integration")`)