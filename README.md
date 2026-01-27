# Qdrant Web Backup

A modern web application for managing Qdrant vector database backups with an intuitive UI, scheduling capabilities, and multi-cloud storage support.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Build Status](https://img.shields.io/github/actions/workflow/status/your-org/qdrant-web-backup/ci.yml?branch=main)
![Docker Pulls](https://img.shields.io/docker/pulls/your-org/qdrant-web-backup)

## Problem Statement

Managing backups for Qdrant vector databases in production environments presents several challenges:

1. **No Built-in UI**: Qdrant provides REST APIs for snapshots but lacks a visual interface for backup management
2. **Manual Operations**: Creating, downloading, and restoring snapshots requires manual CLI or API calls
3. **No Centralized Storage**: Snapshots are stored locally on Qdrant nodes with no easy way to push to cloud storage
4. **Cluster Complexity**: Multi-node clusters require shard-level backup coordination
5. **Monitoring Gaps**: No visibility into backup job status, history, or failures

**Qdrant Web Backup** solves these problems by providing:

- **Visual Dashboard**: Monitor cluster health, collections, and backup status at a glance
- **One-Click Backups**: Create full collection or shard-level snapshots with a single click
- **Cloud Storage Integration**: Automatically push snapshots to S3, MinIO, or local storage
- **Job Management**: Track backup/restore jobs with progress, retry, and cancellation support
- **Restore Workflows**: Easy point-and-click restoration from any stored snapshot

## Features

- **Cluster Monitoring** - Real-time health status, node info, and Raft consensus state
- **Collection Management** - View all collections with shard distribution details
- **Snapshot Operations** - Create, list, download, and delete collection/shard snapshots
- **Storage Backends** - Configure local filesystem or S3-compatible storage
- **Job Queue** - Async backup/restore with progress tracking and retry support
- **Prometheus Metrics** - Export metrics for monitoring and alerting
- **Dark Mode** - Modern UI with light/dark theme support

## Architecture

```
+------------------------------------------------------------------+
|                        Docker Container                           |
|  +-------------+    +--------------+    +--------------------+   |
|  |   Nginx     |--->| React/Vite   |    |   Spring Boot      |   |
|  |  (proxy)    |    |  (frontend)  |    |   (backend)        |   |
|  +-------------+    +--------------+    +----------+---------+   |
|         |                                          |             |
|         +------------------------------------------+             |
+------------------------------------------------------------------+
                                  |
        +-------------------------+-------------------------+
        v                         v                         v
+---------------+       +-----------------+       +-------------+
|    Qdrant     |       |   PostgreSQL    |       |  S3/MinIO   |
|   Cluster     |       |   (metadata)    |       |  (storage)  |
+---------------+       +-----------------+       +-------------+
```

For detailed architecture documentation, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Quick Start

### Using Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/your-org/qdrant-web-backup.git
cd qdrant-web-backup

# Start all services
docker-compose up -d

# Access the UI
open http://localhost:8080
```

### Using Docker

```bash
docker run -d \
  --name qdrant-backup \
  -p 8080:8080 \
  -e QDRANT_HOST=your-qdrant-host \
  -e QDRANT_PORT=6333 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/qdrant_backup \
  ghcr.io/your-org/qdrant-web-backup:latest
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `QDRANT_HOST` | `localhost` | Qdrant server hostname |
| `QDRANT_PORT` | `6333` | Qdrant HTTP port |
| `QDRANT_API_KEY` | - | Qdrant API key (if auth enabled) |
| `DATABASE_URL` | - | PostgreSQL connection URL |
| `DATABASE_USER` | `qdrant` | Database username |
| `DATABASE_PASSWORD` | - | Database password |
| `STORAGE_PATH` | `/app/data/snapshots` | Local snapshot storage path |

## Development Setup

### Prerequisites

- **Node.js** 20.x
- **JDK** 25 (EA)
- **Docker** & Docker Compose
- **Gradle** 9.x (wrapper included)

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server (with MSW mocks)
npm run dev

# Run tests
npm run test:run      # Unit tests
npm run test:e2e      # E2E tests (Playwright)

# Build for production
npm run build
```

### Backend Development

```bash
cd backend

# Run with Gradle
./gradlew bootRun

# Run tests
./gradlew test            # All tests
./gradlew unitTest        # Unit tests only
./gradlew integrationTest # Integration tests only

# Build JAR
./gradlew bootJar
```

### Full Stack Development

```bash
# Start dependencies (Qdrant + PostgreSQL)
docker-compose up -d postgres qdrant

# Terminal 1: Backend
cd backend && ./gradlew bootRun

# Terminal 2: Frontend
cd frontend && npm run dev
```

## API Documentation

The API follows OpenAPI 3.1 specification. Available documentation:

- **Swagger UI**: http://localhost:8080/swagger-ui.html (when running)
- **OpenAPI Spec**: [api/openapi.yaml](./api/openapi.yaml)
- **ReDoc**: http://localhost:8080/api-docs (when running)

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cluster` | Get cluster status |
| `GET` | `/api/v1/collections` | List all collections |
| `POST` | `/api/v1/collections/{name}/snapshots` | Create snapshot |
| `GET` | `/api/v1/storage/config` | Get storage configurations |
| `POST` | `/api/v1/jobs` | Create backup/restore job |
| `GET` | `/api/v1/jobs` | List jobs with pagination |

## Storage Configuration

### Local Storage

```json
{
  "name": "local-backups",
  "type": "local",
  "path": "/data/backups",
  "is_default": true
}
```

### S3 Storage

```json
{
  "name": "aws-s3-backups",
  "type": "s3",
  "s3_bucket": "my-qdrant-backups",
  "s3_region": "us-east-1",
  "s3_access_key": "AKIA...",
  "s3_secret_key": "...",
  "is_default": false
}
```

### MinIO (S3-compatible)

```json
{
  "name": "minio-backups",
  "type": "s3",
  "s3_endpoint": "http://minio:9000",
  "s3_bucket": "qdrant-backups",
  "s3_access_key": "minioadmin",
  "s3_secret_key": "minioadmin",
  "is_default": false
}
```

## Deployment

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  app:
    image: ghcr.io/your-org/qdrant-web-backup:latest
    ports:
      - "8080:8080"
    environment:
      - QDRANT_HOST=qdrant
      - DATABASE_URL=postgresql://postgres:5432/qdrant_backup
      - DATABASE_USER=qdrant
      - DATABASE_PASSWORD=${DB_PASSWORD}
    depends_on:
      - postgres

  postgres:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=qdrant
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=qdrant_backup

volumes:
  postgres_data:
```

### Kubernetes

See [deployment/kubernetes/](./deployment/kubernetes/) for Helm charts and manifests.

### CI/CD

The project includes GitHub Actions workflows:

- **CI** (`ci.yml`): Runs tests on all PRs
- **CD** (`cd.yml`): Builds and pushes Docker images on main
- **Security** (`security.yml`): Dependency and container vulnerability scanning

## Secrets Management

For production deployments, use your platform's secrets management:

| Platform | Recommendation |
|----------|----------------|
| **GitHub Actions** | Repository secrets + Environment secrets |
| **AWS** | AWS Secrets Manager or Parameter Store |
| **Kubernetes** | External Secrets Operator or Sealed Secrets |
| **Docker Compose** | `.env` file (not committed) or Docker Secrets |

**Required secrets:**
- `DATABASE_PASSWORD` - PostgreSQL password
- `QDRANT_API_KEY` - Qdrant API key (if auth enabled)
- `S3_ACCESS_KEY` / `S3_SECRET_KEY` - For S3 storage backends

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure:
- All tests pass (`npm run test:run` and `./gradlew test`)
- Code follows existing style conventions
- New features include appropriate tests

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Qdrant](https://qdrant.tech/) - Vector database
- [Spring Boot](https://spring.io/projects/spring-boot) - Backend framework
- [React](https://react.dev/) - Frontend framework
- [TailwindCSS](https://tailwindcss.com/) - Styling