# PMS Mobile - Documentation

## Overview

PMS (Property Management System) is a Flutter mobile application for an Ethiopian-market property rental platform. It provides tenants and property owners mobile access to manage rentals, payments, maintenance, and notifications.

**Tech Stack:** Flutter 3.x | Riverpod | GoRouter | Dio | Material 3 | Clean Architecture

---

## Architecture

```
lib/
├── core/                          # Shared infrastructure
│   ├── constants/api_constants    # All API endpoint paths
│   ├── errors/failures            # Sealed Failure class (Server, Network, Auth, Validation)
│   ├── network/                   # Dio client, auth interceptor, error handler
│   ├── router/app_router          # GoRouter with role-based auth guards
│   ├── theme/app_theme            # Material 3 theme (blue primary, Inter font)
│   ├── utils/                     # ETB formatter, date helpers, validators
│   └── widgets/                   # Loading, error, empty state widgets
│
├── features/                      # Feature-first modules (4-layer each)
│   ├── auth/                      # Login, Register, Splash (animated)
│   ├── tenant_dashboard/          # Dashboard, lease detail
│   ├── payments/                  # Pay rent, payment list, WebView checkout, bank transfer
│   ├── maintenance/               # Create request, list, detail, feedback
│   ├── properties/                # Property list, detail with units
│   ├── notifications/             # Notification list with type icons
│   ├── owner_dashboard/           # Owner stats, quick actions (presentation only)
│   └── settings/                  # Profile, app settings (presentation only)
│
├── main.dart                      # Entry: ProviderScope, dotenv init
└── app.dart                       # MaterialApp.router, theme config
```

Each feature follows **4 layers:**
| Layer | Purpose | Pattern |
|-------|---------|---------|
| `domain/` | Entities + repository interfaces | JsonSerializable models, abstract classes |
| `application/` | State management | AsyncNotifier, Notifier, Riverpod providers |
| `infrastructure/` | API calls + repo implementations | Dio data sources, Either<Failure, T> returns |
| `presentation/` | Screens + widgets | ConsumerWidget, AsyncValue.when() |

---

## Design System

### Color Palette (aligned with web frontend)

| Token | Hex | Usage |
|-------|-----|-------|
| `primaryBlue` | `#2563EB` | Primary actions, buttons, active states |
| `primaryLight` | `#EFF6FF` | Light blue backgrounds |
| `primaryDark` | `#1D4ED8` | Pressed/dark states |
| `success` | `#10B981` | Active status, completed, green badges |
| `successLight` | `#D1FAE5` | Success backgrounds |
| `warning` | `#F59E0B` | Warnings, pending, gold badges |
| `warningLight` | `#FEF3C7` | Warning backgrounds |
| `errorRed` | `#EF4444` | Errors, destructive actions |
| `errorLight` | `#FEE2E2` | Error backgrounds |
| `gray50-900` | Tailwind scale | Text, borders, backgrounds |

### Typography
- **Font:** Inter (via google_fonts)
- **Headings:** 18-24px, weight 600-700
- **Body:** 13-15px, weight 400-500
- **Labels:** 11-12px, weight 500-600, uppercase for badges

### Components
- **Cards:** White, 12px radius, 0.5px gray-200 border, no elevation
- **Buttons:** 44px min height, 8-10px radius, blue primary fill
- **Inputs:** 8px radius, gray-300 border, blue-600 focus ring
- **Badges:** 20px radius (pill), semantic background + text color
- **Background:** gray-50 (`#F9FAFB`)

---

## Features Status

### Fully Implemented (71 Dart files)

| Feature | Screens | API Connected | Notes |
|---------|---------|---------------|-------|
| **Auth** | Splash, Login, Register | Yes | Animated splash, JWT secure storage, auto-login |
| **Tenant Dashboard** | Dashboard, Lease Detail | Yes | Gradient rent card, lease status, quick actions |
| **Payments** | List, Pay Rent, Detail, WebView, Result, Bank Transfer | Yes | Multi-gateway (Chapa/Telebirr/SantimPay), filters |
| **Maintenance** | List, Create, Detail, Feedback | Yes | Image upload, status timeline, priority filters |
| **Properties** | List, Detail | Yes | Cards with images, unit listing, amenities |
| **Notifications** | List | Yes | Type-specific icons, mark as read, unread count |
| **Owner Dashboard** | Dashboard | Partial | Stats + quick actions (no backend layer) |
| **Settings** | Settings | No | UI only, actions stubbed |

### Route Map (20 routes)

```
/                      → SplashScreen (auto-redirect)
/login                 → LoginScreen
/register              → RegisterScreen
/dashboard             → TenantDashboardScreen (tenant role)
/owner-dashboard       → OwnerDashboardScreen (owner role)
/lease                 → LeaseDetailScreen
/payments              → PaymentListScreen
/payments/pay          → PayRentScreen
/payments/webview      → PaymentWebViewScreen
/payments/result       → PaymentResultScreen
/payments/bank-transfer → BankTransferScreen
/payments/:id          → PaymentDetailScreen
/properties            → PropertyListScreen
/properties/:id        → PropertyDetailScreen
/maintenance           → MaintenanceListScreen
/maintenance/create    → CreateRequestScreen
/maintenance/:id       → MaintenanceDetailScreen
/maintenance/:id/feedback → SubmitFeedbackScreen
/notifications         → NotificationListScreen
/settings              → SettingsScreen
```

---

## Backend Integration

**API Base URL:** `http://localhost:5001/api` (configured in `.env`)

### Endpoints Consumed

| Feature | Endpoints Used |
|---------|---------------|
| Auth | `POST /auth/login`, `POST /auth/register`, `GET /auth/profile` |
| Tenant | `GET /tenants/my/tenancy` |
| Payments | `GET /payments`, `GET /payments/:id`, `POST /payments/initialize`, `GET /payments/verify/:txRef`, `GET /payments/gateways`, `POST /payments/bank-transfer` |
| Maintenance | `GET /maintenance`, `POST /maintenance`, `GET /maintenance/:id`, `PATCH /maintenance/:id/status`, `POST /maintenance/:id/feedback` |
| Properties | `GET /properties`, `GET /properties/:id`, `GET /properties/:id/units`, `POST /properties`, `POST /properties/:id/units` |
| Notifications | `GET /notifications`, `PATCH /notifications/:id/read`, `POST /notifications/mark-all-read`, `GET /notifications/unread-count` |

### Endpoints NOT Yet Used (available in backend)

- Payment approval workflow (`/payments/pending-approval`, `/payments/:id/approve`)
- Payment schedules (`/schedules/*`)
- Payment calendar & reminders
- Waiting list management (`/waitlist/*`)
- Staff management (`/staff/*`)
- Tenant document management
- Property image management (upload, delete, set primary)
- Settings & bank info (`/settings/*`)
- Public listings (`/listings/*`)
- Google OAuth mobile flow

---

## Test Credentials

All seeded users use password: **`password123`**

| Role | Email | Name |
|------|-------|------|
| Owner | owner@example.com | Abebe Kebede |
| Owner | owner2@example.com | Tigist Haile |
| Owner | owner3@example.com | Dawit Mengistu |
| Tenant | tenant1@example.com | Hana Tesfaye |
| Tenant | tenant2@example.com | Yonas Girma |
| Tenant | tenant3@example.com | Sara Alemayehu |

---

## Pencil Designs

11 mobile screen designs in `/Users/samsonusmael/Documents/untitled.pen`:

1. **Splash** - Blue gradient, animated logo, loading bar
2. **Login** - White bg, blue logo, email/password form, Google sign-in
3. **Dashboard** - Greeting app bar, gradient rent card, lease status, quick actions
4. **Payments** - Tab filters, payment list with status badges
5. **Pay Rent** - Amount card, gateway selector (Chapa/Telebirr/Bank)
6. **Maintenance List** - Status filters, request cards with priority
7. **New Request** - Form with category, priority, photo upload
8. **Payment Detail** - Amount card, transaction info rows
9. **Owner Dashboard** - Stats cards, quick actions, property list
10. **Maintenance Detail** - Status timeline, photos, feedback button
11. **Settings** - Profile card, menu items, dark mode toggle, sign out

---

## Running the App

```bash
# Prerequisites: Flutter SDK, Chrome or mobile emulator

# 1. Start backend
cd server && npm run dev

# 2. Start Flutter app
cd pms_mobile && flutter run -d chrome

# 3. Login with test credentials
# tenant1@example.com / password123
```

**Environment:**
- Backend: http://localhost:5001
- React Frontend: http://localhost:5173
- Flutter Web: Chrome (debug mode)

---

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| flutter_riverpod | ^3.2.1 | State management |
| go_router | ^17.1.0 | Navigation + auth guards |
| dio | ^5.9.2 | HTTP client |
| dartz | ^0.10.1 | Either<Failure, T> error handling |
| flutter_secure_storage | ^10.0.0 | JWT token storage |
| google_fonts | ^8.0.2 | Inter font |
| webview_flutter | ^4.13.1 | Payment gateway checkout |
| image_picker | ^1.2.1 | Maintenance photos |
| cached_network_image | ^3.4.1 | Image caching |
| shimmer | ^3.0.0 | Skeleton loading |
| google_sign_in | ^7.2.0 | Google OAuth (pending backend) |
