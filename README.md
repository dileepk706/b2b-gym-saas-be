# B2B Gym SaaS - Backend API

A production-ready Node.js REST API for managing B2B gym operations, memberships, facilities, and staff. Built with TypeScript, Express.js, and PostgreSQL following **Modular Monolith architecture with SOLID principles** and **Domain-Driven Design (DDD)**.

![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Express.js](https://img.shields.io/badge/Express.js-5.2-green?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js)

---

## 📋 Table of Contents

- [🚀 Quick Start](#-quick-start)
- [🏗️ Architecture Overview](#️-architecture-overview)
- [🗄️ Database Design](#️-database-design)
- [📚 API Documentation](#-api-documentation)
- [🛠️ Development Commands](#️-development-commands)
- [🔧 Code Quality & Standards](#-code-quality--standards)
- [📊 Project Structure](#-project-structure)
- [🚦 Getting Started](#-getting-started)
- [📖 Contributing Guidelines](#-contributing-guidelines)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ with npm/yarn
- **PostgreSQL** 14+ (local or Docker)

### Option 1: Local Development Setup

```bash
# Clone repository
git clone <repository-url>
cd b2b-gym-saas-be

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Create database
createdb gym_saas

# Run migrations
npm run migrate:up

# Start development server with hot reload
npm run dev
```

Server will be available at `http://localhost:3000`

### Option 2: Using Docker Compose

```bash
# Clone and navigate
git clone <repository-url>
cd b2b-gym-saas-be

# Start with Docker
docker-compose up

# Run migrations inside container
docker-compose exec api npm run migrate:up

# View API documentation
# Open http://localhost:3000/api/docs in browser
```

### Quick API Test

```bash
# Health check
curl http://localhost:3000/health

# API Documentation (Swagger UI)
curl http://localhost:3000/api/docs

# Get all gyms
curl http://localhost:3000/api/v1/gyms
```

---

## 🏗️ Architecture Overview

### Software Architecture Pattern

This project implements **Modular Monolith** architecture with strict adherence to **SOLID principles** and **Domain-Driven Design (DDD)**.

| Pattern | Purpose |
|---------|---------|
| **Modular Monolith** | Independent, self-contained feature modules |
| **DDD Layering** | Separation between domain, application, and infrastructure |
| **SOLID Principles** | Maintainable, testable, scalable codebase |
| **Dependency Injection** | Loose coupling via TSyringe container |
| **Repository Pattern** | Data access abstraction and testability |

### Architectural Layers per Module

Each feature module is organized into three layers:

```
Module/
├── domain/              # Business logic & entities
│   ├── entities/        # Core domain objects
│   └── interfaces/      # Repository contracts
├── application/         # Use cases & services
│   ├── services/        # Application logic
│   └── dtos/           # Data transfer objects
└── infrastructure/      # Data access & external services
    └── repositories/    # Database queries
```

### Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Runtime** | Node.js | 20+ |
| **Language** | TypeScript | 5.9+ |
| **Framework** | Express.js | 5.2+ |
| **Database** | PostgreSQL | 14+ |
| **Database Client** | node-pg (pg) | 8.20+ |
| **Migrations** | node-pg-migrate | 8.0+ |
| **DI Container** | TSyringe | 4.10+ |
| **Validation** | Zod | 4.3+ |
| **Security** | bcrypt | 6.0+ |
| **Auth** | JWT (jsonwebtoken) | 9.0+ |
| **Logging** | Winston | 3.19+ |
| **API Docs** | Swagger + Scalar | 6.2+ / 0.8+ |
| **HTTP** | Morgan (logging) | 1.10+ |
| **Security** | Helmet | 8.1+ |

### Core Dependencies

```json
{
  "express": "^5.2.1",                    // Web framework
  "pg": "^8.20.0",                        // PostgreSQL client
  "node-pg-migrate": "^8.0.4",           // Database migrations
  "tsyringe": "^4.10.0",                 // Dependency injection
  "bcrypt": "^6.0.0",                    // Password hashing
  "jsonwebtoken": "^9.0.3",              // JWT authentication
  "zod": "^4.3.6",                       // Schema validation
  "winston": "^3.19.0",                  // Structured logging
  "swagger-jsdoc": "^6.2.8",             // API documentation
  "swagger-ui-express": "^5.0.1",        // Swagger UI
  "@scalar/express-api-reference": "^0.8.48" // API reference UI
}
```

### Module Ecosystem

The application is composed of independently deployable modules:

- **Gym Module**: Gym/facility management
- **User Module**: User registration and profile management
- **Auth Module**: JWT token management
- **Tenant Module**: Multi-tenancy support
- **Staff Module**: Staff member management
- **Role Module**: Role definitions and management
- **Permission Module**: Permission system
- **Onboarding Module**: New user onboarding workflow

---

## 🗄️ Database Design

### Raw SQL with Migrations

This project uses **raw SQL** with **node-pg-migrate** for database versioning. No ORM is used.

```bash
# Create new migration
npm run migrate:create -- --name add_users_table

# Apply pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down
```

### Connection Management

Database connections are managed via PostgreSQL connection pool (`pg.Pool`):

```typescript
// src/database/connection.ts
const pool = new Pool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
});
```

### Shared Database Service

`DbSharedService` provides common database operations:

```typescript
// Query execution
const result = await dbService.executeQuery(sql, params);

// Transaction handling
await dbService.withTransaction(async (client) => {
  // Execute queries within transaction
});
```

### Key Database Patterns

✅ **Raw SQL Queries**: Full control over queries  
✅ **Connection Pool**: Efficient resource management  
✅ **Migrations**: Versioned schema changes  
✅ **Transaction Support**: ACID compliance  
✅ **Environment-based Config**: Flexible deployment  

---

## 📚 API Documentation

### Interactive API Documentation

**Swagger UI**: `http://localhost:3000/api/docs`  
**Scalar Reference**: `http://localhost:3000/api/reference`

- 🔍 Browse all endpoints with detailed schemas
- 🧪 Interactive "Try It Out" feature
- 📋 Complete request/response examples
- 🔐 Authentication documentation

### Core API Endpoints

#### Gym Management
```http
POST   /api/v1/gyms                    # Create new gym
GET    /api/v1/gyms                    # List gyms (paginated)
GET    /api/v1/gyms/:id                # Get gym details
PATCH  /api/v1/gyms/:id                # Update gym
DELETE /api/v1/gyms/:id                # Delete gym
```

#### User Management
```http
POST   /api/v1/users                   # Create user
GET    /api/v1/users                   # List users
GET    /api/v1/users/:id               # Get user details
PATCH  /api/v1/users/:id               # Update user
DELETE /api/v1/users/:id               # Delete user
```

#### Authentication
```http
POST   /api/v1/auth/register           # User registration
POST   /api/v1/auth/login              # User login
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Logout user
```

#### Staff Management
```http
POST   /api/v1/staff                   # Add staff member
GET    /api/v1/staff                   # List staff
GET    /api/v1/staff/:id               # Get staff details
PATCH  /api/v1/staff/:id               # Update staff
DELETE /api/v1/staff/:id               # Remove staff
```

#### Roles & Permissions
```http
GET    /api/v1/roles                   # List roles
POST   /api/v1/roles                   # Create role
GET    /api/v1/permissions             # List permissions
POST   /api/v1/permissions             # Create permission
```

### REST Client Examples

#### Using curl

```bash
# Create a gym
curl -X POST http://localhost:3000/api/v1/gyms \
  -H "Content-Type: application/json" \
  -d '{
    "name": "CrossFit Elite",
    "city": "San Francisco",
    "email": "info@crossfit.com",
    "phoneNumber": "+1-415-555-0123"
  }'

# User login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'

# Authenticated request with JWT
curl http://localhost:3000/api/v1/gyms \
  -H "Authorization: Bearer <your_access_token>"
```

#### Using VS Code REST Client

Create a `.rest` or `.http` file:

```rest
### Create Gym
POST http://localhost:3000/api/v1/gyms
Content-Type: application/json

{
  "name": "FitZone Pro",
  "city": "New York",
  "email": "contact@fitzone.com",
  "phoneNumber": "+1-212-555-0100"
}

### Login
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123"
}

### Get All Gyms (with auth)
GET http://localhost:3000/api/v1/gyms
Authorization: Bearer {{access_token}}
```

---

## 🛠️ Development Commands

### Database Management

```bash
# Create a new migration file
npm run migrate:create -- --name migration_name

# Apply all pending migrations
npm run migrate:up

# Rollback to previous state
npm run migrate:down

# Apply specific number of migrations
npm run migrate:up -- --step 2
```

### Development Workflow

```bash
# Start development server with hot reload (tsx watch)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Start production server
npm start

# Type checking
npm typecheck || tsc --noEmit
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code with Prettier
npm run format

# Check if code is formatted correctly
npm run format:check
```

### Complete Quality Check

```bash
# Run all checks (lint + format check)
npm run lint && npm run format:check
```

---

## 🔧 Code Quality & Standards

### TypeScript Configuration

- ✅ **Strict Mode**: Enabled (`strict: true`)
- ✅ **No Implicit Any**: Required explicit types
- ✅ **Strict Null Checks**: Null safety enforced
- ✅ **Decorator Support**: `experimentalDecorators: true`
- ✅ **Metadata Emission**: `emitDecoratorMetadata: true` (for TSyringe)
- ✅ **Path Aliases**: `@/*` maps to `src/`

### ESLint Configuration

```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": "error"
  }
}
```

### Prettier Configuration

- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line objects
- No semicolons at end of lines

### Error Handling

- ✅ Global error middleware for consistent responses
- ✅ Structured error logging with Winston
- ✅ Validation error formatting with Zod
- ✅ HTTP status code consistency
- ✅ Stack trace preservation in logs

### Security Best Practices

- ✅ **Helmet**: Security headers middleware
- ✅ **bcrypt**: Password hashing with salt rounds
- ✅ **JWT**: Token-based authentication
- ✅ **CORS**: Cross-origin resource sharing configured
- ✅ **Compression**: GZIP response compression
- ✅ **Cookie Parser**: Secure cookie handling

---

## 📊 Project Structure

```
src/
├── config/                             # Configuration files
│   ├── container.ts                   # TSyringe DI container setup
│   ├── environment.ts                 # Environment variables validation
│   └── swagger.ts                     # Swagger documentation config
│
├── database/                           # Database layer
│   ├── connection.ts                  # PostgreSQL pool connection
│   ├── migration-utils.js             # Migration utility functions
│   └── migrations/                    # SQL migration files
│       ├── 1704067200000__initial_schema.sql
│       └── [version]__[name].sql
│
├── module/                             # Feature modules (Modular Monolith)
│   ├── gym/                           # Gym management module
│   │   ├── gym.container.ts          # Module DI registration
│   │   ├── domain/                   # Domain layer (business logic)
│   │   │   ├── entities/             # Domain entities
│   │   │   │   └── gym.entity.ts
│   │   │   └── interfaces/           # Repository contracts
│   │   │       └── IGymRepository.ts
│   │   ├── application/              # Application layer (use cases)
│   │   │   ├── services/             # Business logic
│   │   │   │   └── gym.service.ts
│   │   │   └── dtos/                 # Data transfer objects
│   │   │       ├── create-gym.dto.ts
│   │   │       └── update-gym.dto.ts
│   │   └── infrastructure/           # Infrastructure layer (data access)
│   │       └── repositories/         # Repository implementations
│   │           └── gym.repository.ts
│   │
│   ├── user/                         # User management module
│   │   ├── user.container.ts
│   │   ├── domain/
│   │   ├── application/
│   │   └── infrastructure/
│   │
│   ├── token/                        # Authentication token module
│   │   └── [similar structure]
│   │
│   ├── tenant/                       # Multi-tenancy module
│   │   └── [similar structure]
│   │
│   ├── staff/                        # Staff management module
│   │   └── [similar structure]
│   │
│   ├── role/                         # Role management module
│   │   └── [similar structure]
│   │
│   ├── permissions/                  # Permission system module
│   │   └── [similar structure]
│   │
│   └── onboarding/                   # Onboarding workflow module
│       └── [similar structure]
│
├── shared/                             # Shared utilities & middleware
│   ├── factories/                     # Factory patterns
│   │   └── express.app.factory.ts    # Express app setup
│   ├── middleware/                    # Custom Express middleware
│   │   ├── error.middleware.ts       # Global error handler
│   │   ├── auth.middleware.ts        # JWT authentication
│   │   └── validation.middleware.ts  # Request validation
│   ├── services/                      # Shared services
│   │   └── db.shared.service.ts      # Database query service
│   ├── types/                         # Common TypeScript types
│   │   └── response.types.ts         # API response types
│   ├── logger.ts                      # Winston logger configuration
│   └── response_handler.ts            # Response formatting utility
│
├── routes/                             # Express routes aggregation
│   └── index.ts                       # Route registration
│
├── utils/                              # Utility functions
│   ├── validators.ts                 # Validation helpers
│   └── transformers.ts               # Data transformation
│
├── app.ts                             # Main Express app class
└── index.ts                           # Application entry point

scripts/                                # Database scripts
├── seed.sql                           # Seed data
└── init.sql                           # Initial schema setup

.env.example                           # Environment template
.eslintrc.json                         # ESLint configuration
.prettierrc                            # Prettier configuration
tsconfig.json                          # TypeScript configuration
package.json                           # Dependencies & scripts
docker-compose.yml                     # Docker Compose configuration
```

### Module Organization Benefits

1. **Encapsulation**: Each module is self-contained
2. **Reusability**: Easy to reuse domain logic across modules
3. **Testability**: Isolated business logic in domain layer
4. **Maintainability**: Clear separation of concerns
5. **Scalability**: Easy to add new modules or swap implementations

---

## 🚦 Getting Started

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd b2b-gym-saas-be
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DB_HOST=localhost
# - DB_PORT=5432
# - DB_NAME=gym_saas
# - DB_USER=postgres
# - DB_PASSWORD=postgres
# - NODE_ENV=development
# - PORT=3000
# - ACCESS_SECRET=your_access_secret
# - REFRESH_SECRET=your_refresh_secret
```

### Step 4: Database Setup

```bash
# Create database
createdb gym_saas

# Run migrations
npm run migrate:up
```

### Step 5: Start Server

```bash
# Development mode with hot reload
npm run dev

# Or build and run production
npm run build
npm start
```

### Step 6: Verify Setup

```bash
# Check health endpoint
curl http://localhost:3000/health

# Access Swagger UI
open http://localhost:3000/api/docs
```

---

## 📖 Contributing Guidelines

### Code Standards

#### 1. **Type Safety**
- All code must be TypeScript with strict mode
- No `any` types allowed
- Explicit return types on functions

```typescript
// ✅ Good
function getUserById(id: string): Promise<User | null> {
  // implementation
}

// ❌ Bad
function getUserById(id: any): any {
  // implementation
}
```

#### 2. **SOLID Principles**

**Single Responsibility**: Each class/function has one reason to change
```typescript
// ✅ Good - Single responsibility
export class GymService {
  async createGym(dto: CreateGymDto): Promise<Gym> {
    // Only handles gym creation logic
  }
}

// ❌ Bad - Multiple responsibilities
export class GymService {
  async createGym(dto: CreateGymDto): Promise<Gym> {
    // Also logs, sends emails, updates cache...
  }
}
```

**Dependency Inversion**: Depend on abstractions, not concretions
```typescript
// ✅ Good - Depends on interface
export class GymService {
  constructor(private repository: IGymRepository) {}
}

// ❌ Bad - Depends on concrete class
export class GymService {
  constructor(private repository: GymRepository) {}
}
```

#### 3. **DDD Layering**

- **Domain**: Pure business logic, entities, interfaces
- **Application**: Use cases, services, DTOs
- **Infrastructure**: Database repositories, external services

```typescript
// Domain: Entities are rich with business logic
export class Gym {
  addMember(member: Member): void {
    if (this.members.length >= this.capacity) {
      throw new CapacityExceededException();
    }
    this.members.push(member);
  }
}

// Application: Services orchestrate business logic
export class CreateGymService {
  async execute(dto: CreateGymDto): Promise<Gym> {
    const gym = new Gym(dto);
    await this.repository.save(gym);
    return gym;
  }
}

// Infrastructure: Database access
export class GymRepository implements IGymRepository {
  async save(gym: Gym): Promise<void> {
    await db.query('INSERT INTO gyms ...', [gym.data]);
  }
}
```

#### 4. **File Naming Conventions**

```
*.entity.ts          # Domain entities
*.dto.ts             # Data transfer objects
*.interface.ts       # Interfaces/contracts
*.service.ts         # Application services
*.repository.ts      # Repository implementations
*.middleware.ts      # Express middleware
*.factory.ts         # Factory patterns
*.container.ts       # DI registration
```

#### 5. **Error Handling**

```typescript
// ✅ Good - Custom error classes
export class GymNotFound extends Error {
  constructor(id: string) {
    super(`Gym with id ${id} not found`);
    this.name = 'GymNotFound';
  }
}

// Use in service
throw new GymNotFound(id);

// ❌ Bad - Generic errors
throw new Error('Not found');
```

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:
```
feat(gym): add gym creation endpoint

- Implement CreateGymService with validation
- Add GymRepository for data persistence
- Add Swagger documentation

Closes #123
```

```
fix(auth): fix JWT token refresh logic

- Fix expiration check in token validation
- Add proper error handling for expired tokens

Fixes #456
```

### Pull Request Process

1. **Create Feature Branch**: `git checkout -b feat/your-feature`
2. **Make Changes**: Follow code standards above
3. **Run Quality Checks**:
   ```bash
   npm run lint:fix
   npm run format
   ```
4. **Verify Tests**: (When test suite is added)
5. **Commit with Conventional Messages**
6. **Push to GitHub**: `git push origin feat/your-feature`
7. **Create Pull Request** with detailed description

### Pre-push Checklist

```bash
# Type checking
npm run typecheck

# Linting and fixing
npm run lint:fix

# Format checking
npm run format:check

# All checks passed? Ready to push!
```

---

## 🤝 Support & Issues

### Getting Help

1. Check [GitHub Issues](../../issues) for similar problems
2. Review [API Documentation](http://localhost:3000/api/docs)
3. Check error logs: `logs/error.log` and `logs/combined.log`

### Reporting Issues

Provide:
- Clear issue description
- Steps to reproduce
- Error messages and logs
- Your environment (Node.js version, OS, etc.)

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## ✨ Key Features

- ✅ **Modular Monolith**: Independent, self-contained feature modules
- ✅ **DDD Architecture**: Clear separation of domain, application, and infrastructure layers
- ✅ **SOLID Principles**: Maintainable, testable, extensible codebase
- ✅ **Type-Safe**: End-to-end TypeScript with strict mode
- ✅ **Dependency Injection**: TSyringe for loose coupling
- ✅ **Raw SQL**: Full control with node-pg-migrate
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **Multi-tenancy**: Built-in tenant isolation
- ✅ **API Documentation**: Interactive Swagger & Scalar UI
- ✅ **Security**: Helmet, bcrypt, CORS configured
- ✅ **Logging**: Winston with structured logs
- ✅ **Code Quality**: ESLint & Prettier enforced

---

**Built with ❤️ by the Gym SaaS Team**
