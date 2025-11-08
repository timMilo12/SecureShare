# SecureShare - Temporary File Sharing Application

## Overview

SecureShare is a temporary file and text sharing web application that allows users to create password-protected "slots" for sharing content. Each slot expires automatically after 24 hours, ensuring privacy and security. The application requires no user accounts and implements features like password protection, automatic cleanup, and upload limits.

**Core Functionality:**
- Users create numbered slots (6-8 digit IDs) with password protection
- Upload files and/or text content to slots
- Access slots from any device using slot ID and password
- Automatic deletion of all content after 24 hours
- Failed login attempt limiting for security

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- **React 18** with TypeScript for the UI layer
- **Vite** as the build tool and development server
- **Wouter** for lightweight client-side routing (no React Router dependency)
- **TanStack Query (React Query)** for server state management and API interaction

**UI Component System:**
- **shadcn/ui** components built on Radix UI primitives (New York style variant)
- **Tailwind CSS** for utility-first styling with custom design tokens
- **CSS Variables** for theming support (light/dark mode capability)
- Custom spacing, typography, and color systems defined in tailwind.config.ts

**Design Philosophy:**
- Utility-first design inspired by WeTransfer and Dropbox Send
- Emphasis on clarity, security indicators, and workflow efficiency
- Typography: Inter/DM Sans for UI, JetBrains Mono for technical data (slot IDs)
- Responsive layout with mobile-first considerations

**Key Pages:**
1. **Home (/)** - Landing page with "Create Slot" and "Open Slot" actions
2. **Create Slot (/create)** - Multi-step workflow for password setup, file upload, and slot ID display
3. **Open Slot (/open)** - Two-step authentication (slot ID + password) and content viewing

**State Management:**
- React Query for API data fetching, caching, and mutations
- Local component state for UI interactions (file lists, form inputs)
- Toast notifications for user feedback via custom useToast hook

### Backend Architecture

**Runtime & Framework:**
- **Node.js** with **Express** as the web server
- **TypeScript** (ESNext modules) for type safety across the stack
- Custom middleware for request logging and JSON body parsing with raw buffer access

**API Design:**
- RESTful endpoints under `/api` namespace
- Rate limiting (100 requests per 15 minutes) via express-rate-limit
- Multipart form data handling with **Multer** for file uploads

**Key API Routes:**
- `POST /api/slot` - Create new slot with password
- `POST /api/upload/:slotId` - Upload files/text to slot (requires password verification)
- `GET /api/slot/:slotId` or `POST /api/slot/:slotId` - Access slot content (password required)
- `DELETE /api/slot/:slotId` - Manual slot deletion

**Security Implementation:**
- **Argon2** for password hashing (military-grade encryption)
- Failed login attempt tracking (maximum 3 attempts)
- Password never stored in plain text
- Sanitized slot responses (password hashes never sent to client)

**File Storage:**
- Local filesystem storage in `/uploads` directory
- Unique filenames generated using: `timestamp-randomHex.extension`
- Files linked to slots via database relationships

**Background Jobs:**
- **node-cron** scheduler running hourly cleanup (`0 * * * *`)
- Deletes expired slots and associated files from filesystem
- Cleanup process logs execution status to console

### Data Storage

**Database:**
- **Better-SQLite3** for local, embedded database (synchronous API)
- Database file: `secureshare.db` in project root
- **Drizzle ORM** configured for schema management and migrations (though currently using raw SQLite)

**Schema Design:**

1. **slots** table:
   - `id` (TEXT, PRIMARY KEY) - 6-8 digit numeric slot identifier
   - `passwordHash` (TEXT) - Argon2 hashed password
   - `createdAt` (INTEGER) - Unix timestamp
   - `expiresAt` (INTEGER) - Unix timestamp (createdAt + 24 hours)
   - `failedAttempts` (INTEGER, DEFAULT 0) - Security counter

2. **files** table:
   - `id` (TEXT, PRIMARY KEY) - Unique file identifier
   - `slotId` (TEXT, FOREIGN KEY) - References slots.id
   - `filename` (TEXT) - Storage filename
   - `originalName` (TEXT) - User's original filename
   - `size` (INTEGER) - File size in bytes
   - `mimeType` (TEXT, OPTIONAL) - Content type
   - `uploadedAt` (INTEGER) - Unix timestamp

3. **text_content** table:
   - `slotId` (TEXT, PRIMARY KEY) - References slots.id
   - `content` (TEXT) - User-submitted text content

**Data Lifecycle:**
- Slots created with 24-hour expiration (86400000ms from creation)
- Hourly cron job queries for `expiresAt < currentTime`
- Cascading deletion: slot → associated files (DB + filesystem) → text content

### External Dependencies

**Core Runtime Dependencies:**
- `express` - Web server framework
- `better-sqlite3` - Embedded SQLite database
- `argon2` - Password hashing algorithm
- `multer` - Multipart/form-data file upload middleware
- `node-cron` - Job scheduler for cleanup tasks
- `express-rate-limit` - API rate limiting

**Frontend Libraries:**
- `react` & `react-dom` - UI framework
- `@tanstack/react-query` - Server state management
- `wouter` - Lightweight routing
- `@radix-ui/*` - Headless UI primitives (30+ packages for components)
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` & `clsx` - Conditional className utilities
- `zod` - Schema validation (shared between client/server)
- `lucide-react` - Icon library

**Development Tools:**
- `vite` - Build tool and dev server
- `@vitejs/plugin-react` - React integration for Vite
- `typescript` & `tsx` - Type checking and TS execution
- `esbuild` - Production server bundling
- `drizzle-kit` - Database schema migration tool
- Replit-specific plugins (`@replit/vite-plugin-*`) for development environment

**Database Consideration:**
- Application currently uses Better-SQLite3 (local file-based database)
- Drizzle configuration points to PostgreSQL dialect with `@neondatabase/serverless`
- This suggests potential migration path to hosted PostgreSQL (Neon) for production
- DATABASE_URL environment variable expected for Drizzle/Postgres setup

**Build & Deployment:**
- `npm run dev` - Development mode with tsx (TypeScript execution)
- `npm run build` - Vite client build + esbuild server bundle
- `npm run start` - Production mode serving from dist/
- No external hosting dependencies mentioned; designed for self-hosting or Replit deployment