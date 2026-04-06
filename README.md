# Enderase

A comprehensive, full-stack Property Management System built for the Ethiopian rental market. Manage properties, tenants, payments, maintenance, and more from a single platform.

## Features

- **Property Management** - Create and manage properties with units, floor-based pricing, and image uploads
- **Tenant Lifecycle** - Full tenant management from onboarding to lease termination
- **Payment Processing** - Multi-gateway support (Chapa, Telebirr, SantimPay) with automatic receipts
- **Maintenance Tracking** - Request submission, technician assignment, status workflow, and feedback
- **Waiting List** - Queue-based and application-based unit allocation
- **Employee Management** - Staff, guards, attendance, payroll, leave requests, and performance reviews
- **Analytics Dashboard** - Revenue charts, occupancy rates, maintenance overview
- **Notifications** - Real-time notification system with email integration
- **Public Listings** - Property marketplace with listing promotions
- **Multi-Role Access** - Owner, Tenant, Admin, Technician, Manager, Guard roles

## Tech Stack

### Client (Web)
- React 18 + TypeScript
- Vite, Tailwind CSS
- Zustand + TanStack React Query
- React Router DOM

### Server (API)
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- JWT + Google OAuth authentication
- InversifyJS (DI), Bull (job queues), Redis (caching)
- Winston (logging), Swagger (API docs)

### Mobile
- Flutter + Dart
- Riverpod (state management), GoRouter (navigation)
- Dio (HTTP), Flutter Secure Storage
- Clean Architecture (feature-first)

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching and job queues)

### Server Setup

```bash
cd server
cp .env.example .env    # Configure environment variables
npm install
npm run dev             # Starts on http://localhost:5000
```

### Client Setup

```bash
cd client
npm install
npm run dev             # Starts on http://localhost:5173
```

### Mobile Setup

```bash
cd pms_mobile
cp .env.example .env    # Set API_BASE_URL
flutter pub get
flutter run
```

## Environment Variables

### Server (.env)
| Variable | Description | Default |
|----------|-------------|---------|
| PORT | Server port | 5000 |
| NODE_ENV | Environment | development |
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/enderase |
| JWT_SECRET | JWT signing secret | **Required** |
| JWT_EXPIRES_IN | Token expiry | 7d |
| FRONTEND_URL | Client URL for CORS | http://localhost:5173 |
| CHAPA_SECRET_KEY | Chapa payment gateway key | - |
| GOOGLE_CLIENT_ID | Google OAuth client ID | - |
| GOOGLE_CLIENT_SECRET | Google OAuth secret | - |

### Client
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_API_URL | API base URL | /api |

## API Documentation

Swagger documentation is available at `/api/docs` when the server is running.

## Project Structure

```
├── client/              # React web application
├── server/              # Node.js API server
├── pms_mobile/          # Flutter mobile application
└── docs/                # Implementation documentation
```

## License

All rights reserved.
