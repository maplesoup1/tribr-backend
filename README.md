# Tribr Backend API

A minimal NestJS backend for the Tribr mobile application with Supabase authentication.

## Tech Stack

- **Framework**: NestJS 10
- **Database**: PostgreSQL (Supabase)
- **ORM**: Prisma 7
- **Authentication**: Supabase Auth (JWT)
- **Validation**: class-validator & class-transformer
- **Rate Limiting**: @nestjs/throttler

## Architecture

This backend uses a simplified single-table design with Supabase Auth handling all authentication:

- **Authentication**: Supabase Auth (OTP via phone/email, JWT tokens)
- **Database**: Single `users` table via Prisma ORM
- **Guard**: `SupabaseAuthGuard` for protecting routes

## Project Structure

```
tribr-backend/
├── prisma/
│   └── schema.prisma          # Database schema (single User model)
├── src/
│   ├── common/
│   │   └── guards/
│   │       └── supabase-auth.guard.ts  # JWT verification guard
│   ├── config/
│   │   └── config.ts          # Environment config
│   ├── modules/
│   │   └── users/             # Users CRUD module
│   │       ├── dto/
│   │       ├── users.controller.ts
│   │       ├── users.service.ts
│   │       └── users.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts   # Prisma global module
│   │   └── prisma.service.ts  # Prisma client service
│   ├── supabase/
│   │   ├── supabase.module.ts # Supabase global module
│   │   └── supabase.service.ts # Supabase client wrapper
│   ├── app.module.ts          # Root module
│   └── main.ts                # Entry point
└── README.md
```

## Database Schema

Single `User` table with all user data merged:

```prisma
model User {
  id                 String    @id @default(uuid())

  // Authentication (managed by Supabase Auth)
  phone              String    @unique
  countryCode        String    @default("+1")
  email              String?   @unique

  // Basic Info
  fullName           String?

  // Profile (merged from profiles table)
  photoUrl           String?
  archetypes         String[]  @default([])  // max 2 items
  interests          String[]  @default([])
  bio                String?

  // Onboarding
  onboardingComplete Boolean   @default(false)

  // Timestamps
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
}
```

## API Endpoints

### Users Module

#### Get Current User
```http
GET /users/me
Authorization: Bearer <supabase-jwt-token>
```

Returns the current user's profile. Creates user in database if first login.

**Response:**
```json
{
  "id": "uuid",
  "phone": "+1234567890",
  "countryCode": "+1",
  "email": "user@example.com",
  "fullName": "John Doe",
  "photoUrl": "https://...",
  "archetypes": ["adventurer"],
  "interests": ["hiking", "photography"],
  "bio": "Adventure seeker",
  "onboardingComplete": false,
  "createdAt": "2025-12-03T...",
  "updatedAt": "2025-12-03T..."
}
```

#### Update Current User
```http
PATCH /users/me
Authorization: Bearer <supabase-jwt-token>
Content-Type: application/json

{
  "fullName": "John Doe",
  "bio": "Adventure seeker",
  "archetypes": ["adventurer", "explorer"],
  "interests": ["hiking", "photography"]
}
```

Updates the current user's profile information.

## Setup

### 1. Environment Variables

Copy `.env` and fill in your Supabase credentials:

```bash
# Database
DATABASE_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:password@xxx.pooler.supabase.com:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="your-actual-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-actual-service-role-key"
SUPABASE_JWT_SECRET="your-actual-jwt-secret"

# App
PORT=3000
NODE_ENV="development"
```

**Get Supabase credentials from**: https://supabase.com/dashboard/project/_/settings/api

### 2. Install Dependencies

```bash
npm install
```

### 3. Database Setup

```bash
# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

### 4. Run Development Server

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`

## Authentication Flow

1. **Client**: User signs up/logs in via Supabase Auth (handled in mobile app)
2. **Client**: Receives JWT access token from Supabase
3. **Client**: Sends requests with `Authorization: Bearer <token>` header
4. **Backend**: `SupabaseAuthGuard` verifies token with Supabase
5. **Backend**: Extracts user info and attaches to request
6. **Backend**: Auto-creates user in database on first API call

## Development Commands

```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Database
npx prisma studio              # Open Prisma Studio
npx prisma db push             # Push schema changes
npx prisma generate            # Regenerate Prisma Client
```

## Security Notes

1. **Never commit `.env`** - It contains sensitive credentials
2. **Use HTTPS in production** - Protect JWT tokens in transit
3. **Service Role Key** - Only use on backend, never expose to client
4. **JWT Secret** - Required to verify Supabase JWT tokens

## Next Steps

- [ ] Add Swagger/OpenAPI documentation
- [ ] Implement error handling middleware
- [ ] Add request logging
- [ ] Set up unit tests
- [ ] Add Docker support
- [ ] Configure CI/CD pipeline

---

**Last Updated**: 2025-12-03
