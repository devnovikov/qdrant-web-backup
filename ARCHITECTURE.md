# Architecture Documentation

This document describes the architecture of Qdrant Web Backup, including system components, data flows, and design decisions.

## Table of Contents

1. [System Overview](#system-overview)
2. [Component Architecture](#component-architecture)
3. [Data Flow](#data-flow)
4. [Database Schema](#database-schema)
5. [API Design](#api-design)
6. [Security Architecture](#security-architecture)
7. [Deployment Architecture](#deployment-architecture)

## System Overview

Qdrant Web Backup is a three-tier web application designed to provide a user-friendly interface for managing Qdrant vector database backups.

```
+-------------------------------------------------------------------+
|                          USERS                                     |
|                            |                                       |
|                            v                                       |
|    +--------------------------------------------------+           |
|    |              PRESENTATION LAYER                   |           |
|    |                                                   |           |
|    |   +-------------------------------------------+  |           |
|    |   |           React SPA (Vite)                |  |           |
|    |   |  - Dashboard        - Collections         |  |           |
|    |   |  - Snapshots        - Jobs               |  |           |
|    |   |  - Storage Config   - Settings           |  |           |
|    |   +-------------------------------------------+  |           |
|    +--------------------------------------------------+           |
|                            |                                       |
|                            v                                       |
|    +--------------------------------------------------+           |
|    |               APPLICATION LAYER                   |           |
|    |                                                   |           |
|    |   +-------------------------------------------+  |           |
|    |   |         Spring Boot Backend               |  |           |
|    |   |  - REST Controllers   - Service Layer    |  |           |
|    |   |  - Qdrant Client      - Storage Service  |  |           |
|    |   |  - Job Scheduler      - Metrics          |  |           |
|    |   +-------------------------------------------+  |           |
|    +--------------------------------------------------+           |
|                            |                                       |
|                            v                                       |
|    +--------------------------------------------------+           |
|    |                 DATA LAYER                        |           |
|    |                                                   |           |
|    |   +-------------+  +-------------+  +---------+  |           |
|    |   | PostgreSQL  |  |   Qdrant    |  |   S3    |  |           |
|    |   | (metadata)  |  |  (vectors)  |  |(storage)|  |           |
|    |   +-------------+  +-------------+  +---------+  |           |
|    +--------------------------------------------------+           |
+-------------------------------------------------------------------+
```

## Component Architecture

### Frontend Architecture

The frontend is a React Single Page Application built with Vite.

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, cards, etc.)
│   │   ├── layout/         # Layout components (Header, Sidebar)
│   │   └── features/       # Feature-specific components
│   │
│   ├── pages/              # Page components (routed)
│   │   ├── Dashboard.tsx
│   │   ├── Collections.tsx
│   │   ├── Snapshots.tsx
│   │   ├── Jobs.tsx
│   │   └── Storage.tsx
│   │
│   ├── services/           # API client layer
│   │   └── api.ts          # Centralized API service
│   │
│   ├── hooks/              # Custom React hooks
│   │   └── useApi.ts       # Data fetching hooks
│   │
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # API types matching OpenAPI spec
│   │
│   ├── mocks/              # MSW mock handlers for development
│   │   ├── handlers/       # Mock API handlers
│   │   └── browser.ts      # MSW browser setup
│   │
│   └── utils/              # Utility functions
│       └── formatters.ts   # Date, size formatters
```

**Key Technologies:**
- **React 19** - UI framework with concurrent features
- **React Router 7** - Client-side routing
- **TanStack Query** - Server state management
- **TailwindCSS 4** - Utility-first styling
- **MSW 2** - API mocking for development/testing

### Backend Architecture

The backend follows a layered architecture pattern.

```
backend/
├── src/main/kotlin/com/qdrant/backup/
│   ├── QdrantBackupApplication.kt    # Application entry point
│   │
│   ├── controller/                   # REST API Controllers
│   │   ├── ClusterController.kt
│   │   ├── CollectionController.kt
│   │   ├── SnapshotController.kt
│   │   ├── StorageController.kt
│   │   └── JobController.kt
│   │
│   ├── service/                      # Business Logic
│   │   ├── QdrantService.kt          # Qdrant API client
│   │   ├── SnapshotService.kt        # Snapshot operations
│   │   ├── StorageService.kt         # Storage backend management
│   │   └── JobService.kt             # Job queue management
│   │
│   ├── repository/                   # Data Access Layer
│   │   ├── StorageConfigRepository.kt
│   │   └── JobRepository.kt
│   │
│   ├── model/                        # Domain Models
│   │   ├── ClusterModels.kt
│   │   ├── CollectionModels.kt
│   │   ├── SnapshotMetadata.kt
│   │   ├── StorageConfig.kt
│   │   └── BackupJob.kt
│   │
│   └── config/                       # Configuration
│       ├── WebConfig.kt
│       ├── DatabaseConfig.kt
│       └── QdrantConfig.kt
```

**Key Technologies:**
- **Spring Boot 4** - Application framework
- **Kotlin 2.3** - Programming language
- **Exposed ORM** - Database access
- **WebClient** - Non-blocking HTTP client
- **Micrometer** - Metrics and observability

## Data Flow

### Backup Creation Flow

```
+--------+     +----------+     +---------+     +--------+     +---------+
|  User  |---->|  React   |---->| Backend |---->| Qdrant |---->| Storage |
|        |     |   SPA    |     |   API   |     |Cluster |     | (S3/FS) |
+--------+     +----------+     +---------+     +--------+     +---------+
    |               |               |               |               |
    |  1. Click     |               |               |               |
    |  "Backup"     |               |               |               |
    |-------------->|               |               |               |
    |               |  2. POST      |               |               |
    |               |  /jobs        |               |               |
    |               |-------------->|               |               |
    |               |               |  3. Create    |               |
    |               |               |  Job Record   |               |
    |               |               |-------------->|               |
    |               |               |               |               |
    |               |  4. Job ID    |               |               |
    |               |<--------------|               |               |
    |               |               |               |               |
    |               |               |  5. POST      |               |
    |               |               |  /snapshots   |               |
    |               |               |-------------->|               |
    |               |               |               |               |
    |               |               |  6. Snapshot  |               |
    |               |               |     Created   |               |
    |               |               |<--------------|               |
    |               |               |               |               |
    |               |               |  7. Upload to |               |
    |               |               |     Storage   |               |
    |               |               |------------------------------>|
    |               |               |               |               |
    |               |               |  8. Update    |               |
    |               |               |  Job Status   |               |
    |               |               |-------------->|               |
    |               |               |               |               |
    |  9. Poll      |               |               |               |
    |  Job Status   |               |               |               |
    |<------------->|<------------->|               |               |
```

### Restore Flow

```
+--------+     +----------+     +---------+     +---------+     +--------+
|  User  |---->|  React   |---->| Backend |---->| Storage |---->| Qdrant |
|        |     |   SPA    |     |   API   |     | (S3/FS) |     |Cluster |
+--------+     +----------+     +---------+     +---------+     +--------+
    |               |               |               |               |
    |  1. Select    |               |               |               |
    |  Snapshot     |               |               |               |
    |-------------->|               |               |               |
    |               |  2. POST      |               |               |
    |               |  /jobs        |               |               |
    |               |  (restore)    |               |               |
    |               |-------------->|               |               |
    |               |               |               |               |
    |               |               |  3. Generate  |               |
    |               |               |  Signed URL   |               |
    |               |               |-------------->|               |
    |               |               |               |               |
    |               |               |  4. POST      |               |
    |               |               |  /recover     |               |
    |               |               |------------------------------>|
    |               |               |               |               |
    |               |               |               |  5. Download  |
    |               |               |               |<--------------|
    |               |               |               |               |
    |               |               |               |  6. Restore   |
    |               |               |               |     Complete  |
    |               |               |<------------------------------|
```

## Database Schema

### Entity Relationship Diagram

```
+-------------------+       +-------------------+
|   storage_config  |       |    backup_job     |
+-------------------+       +-------------------+
| id (PK)           |       | id (PK)           |
| name              |       | type              |
| type              |       | status            |
| path              |       | collection_name   |
| s3_endpoint       |       | shard_id          |
| s3_bucket         |       | snapshot_name     |
| s3_region         |       | progress          |
| s3_access_key     |       | error             |
| s3_secret_key     |       | metadata (JSON)   |
| is_default        |       | created_at        |
| created_at        |       | started_at        |
| updated_at        |       | completed_at      |
+-------------------+       +-------------------+
```

### Storage Config Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| name | VARCHAR(255) | NOT NULL, UNIQUE | Display name |
| type | VARCHAR(50) | NOT NULL | 'local' or 's3' |
| path | VARCHAR(500) | | Local filesystem path |
| s3_endpoint | VARCHAR(500) | | S3 endpoint URL |
| s3_bucket | VARCHAR(255) | | S3 bucket name |
| s3_region | VARCHAR(100) | | AWS region |
| s3_access_key | VARCHAR(255) | | Access key (encrypted) |
| s3_secret_key | VARCHAR(255) | | Secret key (encrypted) |
| is_default | BOOLEAN | DEFAULT false | Default storage flag |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| updated_at | TIMESTAMP | NOT NULL | Last update timestamp |

### Backup Job Table

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PRIMARY KEY | Unique identifier |
| type | VARCHAR(50) | NOT NULL | Job type enum |
| status | VARCHAR(50) | NOT NULL | Job status enum |
| collection_name | VARCHAR(255) | NOT NULL | Target collection |
| shard_id | INTEGER | | Target shard (optional) |
| snapshot_name | VARCHAR(255) | | Snapshot name |
| progress | INTEGER | DEFAULT 0 | Progress 0-100 |
| error | TEXT | | Error message |
| metadata | JSONB | | Additional metadata |
| created_at | TIMESTAMP | NOT NULL | Creation timestamp |
| started_at | TIMESTAMP | | Start timestamp |
| completed_at | TIMESTAMP | | Completion timestamp |

## API Design

### RESTful Conventions

The API follows REST best practices:

- **Resource-based URLs**: `/api/v1/collections/{name}/snapshots`
- **HTTP Methods**: GET (read), POST (create), PUT (update), DELETE (remove)
- **Consistent Response Format**: `{ status, result, time }`
- **Pagination**: `?page=1&limit=20`
- **Filtering**: `?status=pending&type=backup`

### Response Envelope

All API responses use a consistent envelope:

```json
{
  "status": "ok",
  "result": { /* data */ },
  "time": 0.042
}
```

Error responses:

```json
{
  "status": {
    "error": "Collection not found"
  },
  "time": 0.001
}
```

### Endpoint Categories

```
/api/v1/
├── cluster/              # Cluster health and nodes
│   ├── GET /             # Cluster status
│   └── GET /nodes        # Node list
│
├── collections/          # Collection management
│   ├── GET /             # List collections
│   ├── GET /{name}       # Collection details
│   └── GET /{name}/cluster  # Shard distribution
│
├── collections/{name}/snapshots/  # Snapshot operations
│   ├── GET /             # List snapshots
│   ├── POST /            # Create snapshot
│   ├── GET /{snap}       # Download snapshot
│   ├── DELETE /{snap}    # Delete snapshot
│   └── POST /recover     # Restore from snapshot
│
├── storage/              # Storage configuration
│   ├── GET /config       # List configurations
│   ├── POST /config      # Create configuration
│   ├── PUT /config/{id}  # Update configuration
│   ├── DELETE /config/{id}  # Delete configuration
│   └── POST /test        # Test connectivity
│
├── jobs/                 # Job management
│   ├── GET /             # List jobs (paginated)
│   ├── POST /            # Create job
│   ├── GET /{id}         # Job details
│   ├── POST /{id}/cancel # Cancel job
│   └── POST /{id}/retry  # Retry job
│
└── metrics               # Prometheus metrics
    └── GET /             # Metrics endpoint
```

## Security Architecture

### Authentication & Authorization

```
+--------+     +-------+     +---------+     +--------+
| Client |---->| Nginx |---->| Backend |---->| Qdrant |
+--------+     +-------+     +---------+     +--------+
    |              |              |              |
    |   TLS/SSL    |              |              |
    |<------------>|              |              |
    |              |              |              |
    |         [Optional Auth]     |              |
    |              |              |   API Key    |
    |              |              |------------->|
```

### Secrets Management

| Secret | Storage Method | Access |
|--------|----------------|--------|
| Database credentials | Environment variables | Backend only |
| Qdrant API key | Environment variables | Backend only |
| S3 credentials | Encrypted in database | Backend only |
| JWT signing key | Environment variables | Backend only |

### Security Best Practices

1. **TLS Everywhere**: All external communications use HTTPS
2. **Credential Encryption**: S3 credentials encrypted at rest
3. **Input Validation**: All API inputs validated and sanitized
4. **CORS Configuration**: Strict origin policy in production
5. **Rate Limiting**: API rate limits to prevent abuse
6. **Audit Logging**: All operations logged with user context

## Deployment Architecture

### Single Container Deployment

```
+---------------------------------------------------------------+
|                    Docker Container                            |
|                                                                |
|   +------------------+    +------------------+                 |
|   |      Nginx       |    |   supervisord    |                 |
|   |   (port 8080)    |    |                  |                 |
|   +--------+---------+    +--------+---------+                 |
|            |                       |                           |
|            v                       v                           |
|   +------------------+    +------------------+                 |
|   |  Static Files    |    |  Spring Boot     |                 |
|   |  (React build)   |    |  (port 8081)     |                 |
|   +------------------+    +------------------+                 |
|                                                                |
+---------------------------------------------------------------+
         |                           |
         v                           v
+------------------+       +------------------+
|   PostgreSQL     |       |     Qdrant       |
|   (port 5432)    |       |   (port 6333)    |
+------------------+       +------------------+
```

### Kubernetes Deployment

```
+------------------------------------------------------------------+
|                        Kubernetes Cluster                         |
|                                                                   |
|   +-------------------+     +-------------------+                 |
|   |    Ingress        |     |    ConfigMap      |                 |
|   |  (TLS termination)|     | (app config)      |                 |
|   +--------+----------+     +-------------------+                 |
|            |                                                      |
|            v                                                      |
|   +-------------------+     +-------------------+                 |
|   |   Service         |     |    Secret         |                 |
|   | (LoadBalancer)    |     | (credentials)     |                 |
|   +--------+----------+     +-------------------+                 |
|            |                                                      |
|            v                                                      |
|   +-------------------+     +-------------------+                 |
|   |   Deployment      |     |  HorizontalPod    |                 |
|   |  (replicas: 3)    |     |  Autoscaler       |                 |
|   +--------+----------+     +-------------------+                 |
|            |                                                      |
|            v                                                      |
|   +-------------------+                                           |
|   | PersistentVolume  |                                           |
|   | (snapshot storage)|                                           |
|   +-------------------+                                           |
|                                                                   |
+------------------------------------------------------------------+
```

### High Availability Setup

For production deployments requiring high availability:

```
                    +-------------------+
                    |   Load Balancer   |
                    +--------+----------+
                             |
         +-------------------+-------------------+
         |                   |                   |
         v                   v                   v
+----------------+   +----------------+   +----------------+
|   App Pod 1    |   |   App Pod 2    |   |   App Pod 3    |
+----------------+   +----------------+   +----------------+
         |                   |                   |
         +-------------------+-------------------+
                             |
                             v
                    +-------------------+
                    | PostgreSQL HA     |
                    | (Primary/Replica) |
                    +-------------------+
```

## Technology Stack Summary

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Frontend | React | 19.x | UI Framework |
| Frontend | TypeScript | 5.x | Type Safety |
| Frontend | Vite | 6.x | Build Tool |
| Frontend | TailwindCSS | 4.x | Styling |
| Frontend | React Query | 5.x | Data Fetching |
| Frontend | MSW | 2.x | API Mocking |
| Backend | Kotlin | 2.3 | Language |
| Backend | Spring Boot | 4.1 | Framework |
| Backend | Exposed | 0.57 | ORM |
| Backend | JDK | 25 | Runtime |
| Database | PostgreSQL | 16.x | Persistence |
| Database | H2 | - | Development |
| Container | Docker | - | Deployment |
| Proxy | Nginx | Alpine | Reverse Proxy |
| Process | supervisord | - | Process Manager |

## Design Decisions

### Why Kotlin?

- **Null Safety**: Reduces runtime errors
- **Coroutines**: Efficient async operations
- **Data Classes**: Concise model definitions
- **Spring Integration**: First-class support

### Why Exposed ORM?

- **Type-safe SQL**: Compile-time query validation
- **Kotlin DSL**: Natural syntax for Kotlin developers
- **Lightweight**: No runtime bytecode generation

### Why Single Container?

- **Simplicity**: Single deployment unit
- **Resource Efficiency**: Shared process space
- **Easy Scaling**: Horizontal scaling via container replicas

### Why MSW for Mocks?

- **Realistic Testing**: Mocks at network level
- **Development Speed**: No backend required
- **Test Reliability**: Same mocks in dev and tests