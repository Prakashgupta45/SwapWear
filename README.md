# SwapWear: Clothing Exchange & Swap Marketplace

Production-grade web application architecture for **SwapWear** — a sustainable circular fashion marketplace.

---

## Phase 1 Implementation Summary

Phase 1 establishes the core application architecture and secure user authentication:

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui-inspired accessible components, sustainable visual identity.
- **Backend**: Node.js, Express, TypeScript, RESTful API architecture.
- **Database**: PostgreSQL with Prisma ORM (`User` model, `Role` enum, indexed fields, versioned migrations, seed support).
- **Authentication & Security**:
  - Secure bcrypt password hashing (12 salt rounds).
  - JWT authentication stored in secure `HTTP-only` cookies (`SameSite: 'lax'`, `path: '/'`).
  - Strict exclusion of `passwordHash` in all responses and views.
  - Role-based authorization middleware (`USER` / `ADMIN`).
  - Request payload validation via Zod schemas.
  - Strict CORS policy with credentials support.
- **Testing**: Jest + Supertest test suite covering all 12 planned verification scenarios.

---

## Project Structure

```
SwapWear/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema (User model, Role enum, indexes)
│   │   ├── migrations/          # Versioned Prisma migrations
│   │   └── seed.ts              # Seed initial Admin and User
│   ├── src/
│   │   ├── config/              # Prisma client & environment configuration
│   │   ├── controllers/         # Auth controllers (register, login, logout, me)
│   │   ├── middleware/          # Auth, role authorization, validation, error handler
│   │   ├── routes/              # Express auth routes
│   │   ├── services/            # Auth business logic
│   │   ├── utils/               # JWT token, bcrypt password, cookie helpers
│   │   ├── validations/         # Zod schemas for auth
│   │   ├── types/               # TypeScript interfaces and request extensions
│   │   ├── app.ts               # Express app instance & middlewares
│   │   └── server.ts            # Server bootstrap
│   ├── tests/
│   │   ├── auth.test.ts         # 12-scenario integration tests
│   │   ├── middleware.test.ts   # Middleware unit tests
│   │   └── password.test.ts     # Password hashing tests
│   ├── scripts/
│   │   └── start-db.ts          # Zero-config embedded PostgreSQL runner
│   ├── jest.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx         # Sustainable fashion landing page
│   │   │   ├── login/page.tsx   # Login page
│   │   │   ├── register/page.tsx# Register page with live criteria validation
│   │   │   ├── dashboard/page.tsx # Protected dashboard
│   │   │   ├── layout.tsx       # Root layout with AuthProvider & Navbar
│   │   │   └── globals.css      # Tailwind styling
│   │   ├── components/
│   │   │   ├── ui/              # Button, Input, Card, Label, Alert, Badge
│   │   │   ├── Navbar.tsx       # Dynamic responsive navigation
│   │   │   └── AuthGuard.tsx    # Protected route client wrapper
│   │   ├── context/
│   │   │   └── AuthContext.tsx  # Auth state management
│   │   ├── lib/
│   │   │   ├── api.ts           # Credentials-enabled API client
│   │   │   └── utils.ts         # Utility functions
│   │   ├── validations/
│   │   │   └── auth.ts          # Client-side Zod validation schemas
│   │   └── types/
│   │       └── auth.ts          # Frontend auth types
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── postcss.config.mjs
│   ├── next.config.mjs
│   └── .env.example
│
├── docker-compose.yml           # PostgreSQL container definition
└── package.json                 # Monorepo scripts
```

---

## Authentication APIs

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user, set HTTP-only cookie, return safe user data |
| `POST` | `/api/auth/login` | Public | Verify credentials, set HTTP-only cookie, return safe user data |
| `POST` | `/api/auth/logout` | Public | Clear HTTP-only authentication cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve authenticated user profile (passwordHash excluded) |
| `GET` | `/api/admin/check` | Authenticated (ADMIN) | Test endpoint for role-based authorization |

---

## Getting Started

### 1. Database Setup

You can run PostgreSQL via Docker or Embedded Postgres:

**Option A: Docker Compose**
```bash
docker compose up -d
```

**Option B: Embedded PostgreSQL (Zero Setup)**
```bash
cd backend
npm run db:start
```

### 2. Backend Setup
```bash
cd backend
npm install
npx prisma db push # or npm run prisma:migrate
npm run prisma:seed
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Visit:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`

### 4. Running Tests
```bash
cd backend
npm test
```
