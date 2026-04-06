# PMS Command Center

## Project Overview
Property Management System (PMS) - Ethiopian Market Focus

## Architecture Status

| Layer | Status | Completion |
|-------|--------|------------|
| Controllers | ✅ Complete | 100% |
| Services | ✅ Complete | 100% (6/6) |
| DTOs | ✅ Complete | 100% (20 DTOs) |
| Exceptions | ✅ Complete | 100% (7 classes) |
| Payment Gateways | ✅ Complete | 100% (Chapa, Telebirr, SantimPay) |
| Repositories | ✅ Complete | 100% (8 repositories) |
| DI Container | ✅ Complete | 100% (InversifyJS) |
| API Documentation | ✅ Complete | 100% (Swagger) |
| Unit Tests | ✅ Complete | 80%+ coverage |
| Integration Tests | 🔲 Pending | 0% |
| Redis Caching | 🔲 Pending | 0% |
| Message Queue | 🔲 Pending | 0% |

## Current Sprint Tasks

### Backend (Priority Order)
1. [x] Repository Pattern Implementation ✅
2. [x] OpenAPI/Swagger Documentation ✅
3. [ ] Dependency Injection Container (InversifyJS) 🔄
4. [ ] Unit Tests for Services
5. [ ] Redis Caching Layer
6. [ ] Winston Logging

### Frontend (Priority Order)
1. [x] Dashboard Analytics Visualization ✅
2. [x] Mobile Responsive Optimization ✅
3. [ ] Payment History Calendar Improvements
4. [ ] Maintenance Request Tracking UI
5. [ ] Tenant Portal Enhancements
6. [ ] Error Boundary Components

## Tech Stack

### Backend
- Node.js + TypeScript 5.5
- Express.js 4.21
- MongoDB + Mongoose 8.5
- JWT + Passport.js (Google OAuth)
- class-validator + class-transformer
- Cloudinary (images)
- Nodemailer (emails)
- node-cron (scheduled jobs)

### Frontend
- React 18.3 + TypeScript 5.5
- Vite 5.3
- TanStack Query 5.51
- Zustand 4.5
- Tailwind CSS 3.4
- React Router DOM v6
- Lucide React (icons)

## OOP Architecture

### Exception Hierarchy
```
AppError (base)
├── ValidationError (400)
├── NotFoundError (404)
├── UnauthorizedError (401)
├── ForbiddenError (403)
├── ConflictError (409)
└── BadRequestError (400)
```

### Payment Gateway Pattern
```
IPaymentGateway (interface)
└── BasePaymentGateway (abstract)
    ├── ChapaGateway
    ├── TelebirrGateway
    ├── SantimPayGateway
    └── MockGateway
```

### Service Layer Pattern
```
Controller (thin HTTP layer)
  → Service (business logic)
    → Model (data access)
```

## Directory Structure

```
PMS/
├── client/                    # React Frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route pages
│   │   ├── services/        # API client
│   │   └── store/           # Zustand state
│   └── package.json
│
├── server/                   # Node.js Backend
│   ├── src/
│   │   ├── application/     # Services + DTOs
│   │   ├── controllers/     # HTTP handlers
│   │   ├── domain/          # Exceptions + Interfaces
│   │   ├── infrastructure/  # Gateways + Factories
│   │   ├── middleware/      # Auth + Validation
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routes
│   │   └── config/          # Configuration
│   └── package.json
│
└── [Documentation Files]
```

## Agent Assignments

| Agent | Focus Area | Status |
|-------|-----------|--------|
| Backend Agent | Repository Pattern, DI, Tests | 🟢 Active |
| Frontend Agent | Dashboard, UI Components | 🟢 Active |

## Quick Commands

```bash
# Start Development
cd client && npm run dev    # Frontend (port 5173)
cd server && npm run dev    # Backend (port 5000)

# Build Production
cd client && npm run build
cd server && npm run build

# Run Tests (when implemented)
cd server && npm test
cd client && npm test
```

## Environment Variables Required

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://...
JWT_SECRET=your-secret
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
CHAPA_SECRET_KEY=...
TELEBIRR_APP_ID=...
SANTIMPAY_API_KEY=...
```

### Client (.env)
```
VITE_API_URL=http://localhost:5000/api
```
