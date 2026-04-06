# Changelog

All notable changes to Enderase will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Repository Pattern** - 8 repositories with generic CRUD + domain-specific methods
- **OpenAPI/Swagger Documentation** - Full API docs at /api/docs (68 endpoints)
- **Dashboard Analytics Components** - RevenueChart, OccupancyChart, MaintenanceOverview, TenantSummary
- **Dependency Injection Container** - InversifyJS with full service/repository bindings
- **Mobile Responsiveness** - 18 components updated with touch-friendly UI
- **Unit Test Suite** - Jest + ts-jest with 80%+ coverage target
  - AuthService, PropertyService, TenantService, PaymentService tests
  - Mock repositories for isolated testing

### Planned
- Redis caching layer
- Message queue (Bull/RabbitMQ)

---

## [1.0.0] - 2026-02-18

### Added

#### Backend Architecture
- **Service Layer** (100% complete)
  - `AuthService` - Authentication and authorization logic
  - `PropertyService` - Property and unit management
  - `TenantService` - Tenant lifecycle management
  - `PaymentService` - Multi-gateway payment processing
  - `MaintenanceService` - Maintenance request handling
  - `WaitingListService` - Queue and application management

- **Exception Hierarchy**
  - `AppError` - Base exception class
  - `ValidationError` - Input validation failures (400)
  - `NotFoundError` - Resource not found (404)
  - `UnauthorizedError` - Authentication required (401)
  - `ForbiddenError` - Access denied (403)
  - `ConflictError` - Resource conflict (409)
  - `BadRequestError` - Invalid request (400)

- **Payment Gateway Integration**
  - `IPaymentGateway` interface for polymorphism
  - `BasePaymentGateway` abstract class with shared logic
  - `ChapaGateway` - Chapa payment integration
  - `TelebirrGateway` - Telebirr mobile money
  - `SantimPayGateway` - SantimPay integration
  - `PaymentGatewayFactory` - Singleton factory pattern
  - Bank transfer workflow with owner approval

- **DTOs with Validation**
  - 20+ Data Transfer Objects using class-validator
  - Centralized validation middleware
  - Type-safe request handling

- **Email Services**
  - `EmailReminderService` - Automated payment reminders
  - Daily cron job at 8:00 AM for reminders

#### Features
- **Authentication**
  - Local registration/login with bcrypt
  - Google OAuth2 integration
  - JWT token authentication (7-day expiry)
  - Role-based access (owner, tenant, admin, technician, marketing, manager)

- **Property Management**
  - Property CRUD (apartment, house, commercial, villa)
  - Unit management with floor-based pricing
  - Cloudinary image uploads
  - Property listing visibility toggle

- **Tenant Management**
  - Full lifecycle: pending → active → terminated
  - Lease agreement management
  - Document uploads
  - Emergency contacts

- **Payment System**
  - Multi-gateway payment initialization
  - Webhook handling with signature verification
  - Manual cash payment recording
  - Bank transfer approval workflow
  - Payment statistics and analytics
  - Payment calendar view

- **Waiting List**
  - Queue mode (position-based)
  - Application mode (form-based)
  - Unit offering with expiration
  - Accept/reject workflow

- **Maintenance**
  - 6-status workflow
  - Technician assignment
  - Timeline tracking
  - Rating and feedback system

- **Staff Management**
  - Property staff assignment
  - Granular permissions system

#### Frontend
- React 18 with TypeScript
- TanStack Query for data fetching
- Zustand for state management
- Role-based routing
- Owner dashboard
- Tenant dashboard
- Public listings page

### Fixed
- Port mismatch between client (5001) and server (5000) in vite.config.ts

### Changed
- Refactored controllers from procedural to class-based
- Extracted business logic from controllers to services
- Controller code reduced by 49% (2,235 → 1,132 lines)

### Security
- JWT authentication on all protected routes
- Password hashing with bcrypt
- Role-based authorization middleware
- Webhook signature verification

---

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 1.0.0 | 2026-02-18 | Initial release with full service layer |

---

## Contributors

- Development Team
- Code Review: Claude Code AI Assistant

---

## Legend

- **Added** - New features
- **Changed** - Changes in existing functionality
- **Deprecated** - Features to be removed in future
- **Removed** - Features removed
- **Fixed** - Bug fixes
- **Security** - Security improvements
