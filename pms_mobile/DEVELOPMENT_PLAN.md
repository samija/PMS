# Enderase Mobile - Development Plan

## Current State Summary (Updated: March 2026)

**Total Dart files:** 111 across 12 features, 30+ routes, 11 Pencil designs
**Overall completion:** ~85%

### Completion by Feature

| Feature | Status | Completion | Notes |
|---------|--------|------------|-------|
| Auth | COMPLETE | 100% | Login, Register, Splash (animated), JWT storage, auto-login |
| Tenant Dashboard | COMPLETE | 100% | Gradient rent card, lease status, quick actions, property info |
| Payments | COMPLETE | 100% | 8 screens incl. pending approvals + approval detail |
| Maintenance | COMPLETE | 100% | Create, list, detail, feedback, image upload, status timeline |
| Notifications | MOSTLY DONE | 95% | List with type icons, mark as read, unread count. Missing: push (FCM) |
| Properties | COMPLETE | 100% | List, detail, add, edit, add unit screens |
| Owner Dashboard | COMPLETE | 90% | Backend layer (stats, providers), needs real API testing |
| Settings | COMPLETE | 90% | Edit profile, dark mode, help/support, sign out, about |
| Listings & Booking | NEW - COMPLETE | 90% | Browse, detail, apply, my applications |
| Tenants | NEW - COMPLETE | 90% | List, detail, add tenant with lease |
| Schedules | NEW - COMPLETE | 85% | Schedule list, payment calendar |
| Shimmer Loading | NEW - COMPLETE | 100% | 7 shimmer skeleton widgets |
| Dark Mode | NEW - COMPLETE | 100% | Theme provider with persistence |
| Bottom Navigation | NEW - COMPLETE | 100% | Role-based nav (tenant/owner) |
| Waiting List | NOT STARTED | 0% | — |
| Payment Schedules | NOT STARTED | 0% | — |
| Staff Management | NOT STARTED | 0% | — |
| Testing | NOT STARTED | 0% | No unit, widget, or integration tests |
| Localization | NOT STARTED | 0% | intl package included but not configured |

### Completed Infrastructure
- [x] Dio HTTP client with auth interceptor and error handling
- [x] GoRouter with role-based auth guards (tenant/owner redirect)
- [x] Material 3 theme aligned with web frontend (blue primary, Inter font)
- [x] ETB currency formatter, date helpers, validators
- [x] Shared widgets: LoadingWidget, AppErrorWidget, empty states
- [x] Sealed Failure class (Server, Network, Auth, Validation)
- [x] JWT secure storage with auto-login
- [x] Pencil designs for 11 screens

### Not Yet Utilized
- `shimmer` package included but 0 usages (all screens use CircularProgressIndicator)
- `google_sign_in` package included but backend endpoint not available
- `cached_network_image` used only in maintenance photos

---

## Phase 4: Owner Features Completion (Priority: HIGH)

### 4.1 Owner Dashboard Backend Layer
**Goal:** Connect owner dashboard to real API data instead of property providers
**Status:** NOT STARTED

**Tasks:**
- [ ] Create `owner_dashboard/domain/owner_stats.dart` - Revenue, occupancy, pending items entities
- [ ] Create `owner_dashboard/domain/owner_repository.dart` - Abstract repository
- [ ] Create `owner_dashboard/infrastructure/owner_remote_data_source.dart` - API calls to `/payments/stats/summary`, `/maintenance/stats/summary`
- [ ] Create `owner_dashboard/infrastructure/owner_repository_impl.dart`
- [ ] Create `owner_dashboard/application/owner_dashboard_provider.dart` - Stats + recent activity
- [ ] Update `owner_dashboard_screen.dart` to use real data providers
- [ ] Add revenue chart widget (monthly payment totals)
- [ ] Add occupancy rate display

**API Endpoints:**
- `GET /payments/stats/summary` - Revenue, pending, overdue counts
- `GET /maintenance/stats/summary` - Open, in-progress, completed counts
- `GET /properties` - Property list with unit counts
- `GET /tenants` - Active tenant count

**Estimated effort:** 2-3 days

### 4.2 Payment Approval Workflow (Owner)
**Goal:** Owners can approve/reject bank transfer payments
**Status:** NOT STARTED

**Tasks:**
- [ ] Add `pendingApprovalProvider` using `GET /payments/pending-approval`
- [ ] Create `PendingApprovalsScreen` - List of bank transfers awaiting approval
- [ ] Create `ApprovalDetailScreen` - View receipt image, approve/reject
- [ ] Add `approve()` and `reject()` methods to payment provider
- [ ] Add route `/payments/pending` to router
- [ ] Add "Pending Approvals" badge to owner dashboard

**API Endpoints:**
- `GET /payments/pending-approval`
- `PATCH /payments/:id/approve`
- `PATCH /payments/:id/reject`

**Estimated effort:** 2 days

### 4.3 Tenant Management (Owner)
**Goal:** Owners can view, add, and manage tenants
**Status:** NOT STARTED

**Tasks:**
- [ ] Create `tenants/` feature module (domain, infrastructure, application, presentation)
- [ ] Create `TenantListScreen` - All tenants with lease status
- [ ] Create `TenantDetailScreen` - Full tenant info, lease, payment history
- [ ] Create `AddTenantScreen` - Assign tenant to unit with lease terms
- [ ] Create `TerminateTenantDialog` - Lease termination confirmation
- [ ] Add routes: `/tenants`, `/tenants/:id`, `/tenants/add`

**API Endpoints:**
- `GET /tenants`, `GET /tenants/:id`
- `POST /tenants` (create with lease)
- `PUT /tenants/:id` (update)
- `POST /tenants/:id/terminate`

**Estimated effort:** 3-4 days

### 4.4 Property CRUD (Owner)
**Goal:** Complete property and unit management screens
**Status:** PARTIAL (list + detail done, CRUD missing)

**Tasks:**
- [x] Property list screen with cards and images
- [x] Property detail screen with unit listing
- [x] Domain entities (Property, Unit, Address)
- [x] Infrastructure layer (remote data source, repository impl)
- [x] Application layer (providers for list + detail)
- [ ] Create `AddPropertyScreen` - Name, address, amenities form
- [ ] Create `EditPropertyScreen` - Update property details
- [ ] Create `AddUnitScreen` - Unit number, type, floor, rent
- [ ] Create `EditUnitScreen` - Update unit details
- [ ] Add property/unit image upload

**Estimated effort:** 2-3 days

---

## Phase 5: Settings & Profile (Priority: HIGH)

### 5.1 Edit Profile
**Status:** NOT STARTED (settings screen exists but profile edit is stubbed)

**Tasks:**
- [ ] Create `EditProfileScreen` - Name, phone, avatar upload
- [ ] Add `updateProfile()` to auth provider using `PUT /auth/profile`
- [ ] Add avatar image picker and upload
- [ ] Add route `/settings/profile`

**API Endpoint:** `PUT /auth/profile`

**Estimated effort:** 1 day

### 5.2 Dark Mode
**Status:** NOT STARTED (toggle exists in settings UI but not wired)

**Tasks:**
- [ ] Create `ThemeProvider` with Riverpod (stores preference)
- [ ] Persist theme choice in SharedPreferences
- [ ] Update `app.dart` to use themeMode from provider
- [ ] Wire up Settings dark mode toggle

**Estimated effort:** 0.5 days

### 5.3 Language / Localization
**Status:** NOT STARTED

**Tasks:**
- [ ] Set up Flutter l10n with `intl` package
- [ ] Create `lib/l10n/app_en.arb` (English)
- [ ] Create `lib/l10n/app_am.arb` (Amharic)
- [ ] Extract all user-facing strings (~200 strings)
- [ ] Create `LanguageProvider` with persistence
- [ ] Add language picker in Settings

**Estimated effort:** 3-4 days

---

## Phase 6: Push Notifications (Priority: MEDIUM)

### 6.1 Firebase Cloud Messaging
**Status:** NOT STARTED (in-app notification list is done, push not implemented)

**Tasks:**
- [ ] Add `firebase_core` and `firebase_messaging` packages
- [ ] Configure Firebase project for iOS + Android
- [ ] Create `NotificationService` - FCM token registration, foreground/background handling
- [ ] Register device token on login: `POST /auth/device-token` (backend needs this endpoint)
- [ ] Remove device token on logout: `DELETE /auth/device-token`
- [ ] Handle notification taps - deep link to relevant screen
- [ ] Show local notification for foreground messages
- [ ] Add notification badge count to bottom nav / app bar

**Backend Changes Required:**
- [ ] `POST /api/auth/device-token` - Register FCM token
- [ ] `DELETE /api/auth/device-token` - Remove FCM token on logout
- [ ] Integrate FCM sending into notification service

**Estimated effort:** 3-4 days

---

## Phase 7: Enhanced UX & Polish (Priority: MEDIUM)

### 7.1 Shimmer Loading
**Status:** NOT STARTED (shimmer package included but unused)

**Tasks:**
- [ ] Create `ShimmerCard`, `ShimmerList`, `ShimmerDetail` widgets
- [ ] Replace `CircularProgressIndicator` loading states with shimmer skeletons
- [ ] Add shimmer to: Dashboard, Payment List, Maintenance List, Property List

**Estimated effort:** 1 day

### 7.2 Pull-to-Refresh Everywhere
**Status:** PARTIAL (some screens have RefreshIndicator)

**Tasks:**
- [x] RefreshIndicator on tenant dashboard
- [x] RefreshIndicator on payment list
- [x] RefreshIndicator on maintenance list
- [ ] Verify RefreshIndicator on all remaining list screens
- [ ] Add pull-to-refresh to detail screens
- [ ] Add retry buttons on all error states

**Estimated effort:** 0.5 days

### 7.3 Offline Caching
**Status:** NOT STARTED

**Tasks:**
- [ ] Add `hive` or `sqflite` for local storage
- [ ] Cache dashboard data, payment list, maintenance list
- [ ] Show cached data when offline with "Offline" banner
- [ ] Sync on reconnection

**Estimated effort:** 3-4 days

### 7.4 Image Optimization
**Status:** NOT STARTED

**Tasks:**
- [ ] Compress images before upload (maintenance photos)
- [ ] Add placeholder/error images for all CachedNetworkImage
- [ ] Add image zoom/gallery view for maintenance detail photos

**Estimated effort:** 1 day

---

## Phase 8: Additional Features (Priority: LOW)

### 8.1 Waiting List
**Status:** NOT STARTED

**Tasks:**
- [ ] Create `waitlist/` feature module
- [ ] `WaitlistScreen` - Browse available listings
- [ ] `ApplyScreen` - Submit application for a unit
- [ ] `MyApplicationsScreen` - Track application status
- [ ] Respond to offers (accept/decline)

**API Endpoints:** `GET /listings`, `POST /waitlist/apply`, `GET /waitlist/my-applications`, `POST /waitlist/:id/respond`

**Estimated effort:** 2-3 days

### 8.2 Payment Schedules
**Status:** NOT STARTED

**Tasks:**
- [ ] Display upcoming payment schedule on dashboard
- [ ] Payment calendar view (month grid)
- [ ] Payment reminders display

**API Endpoints:** `GET /schedules/tenant/:id`, `GET /payments/calendar`, `GET /payments/reminders`

**Estimated effort:** 2 days

### 8.3 Property Image Management (Owner)
**Status:** NOT STARTED

**Tasks:**
- [ ] Upload property images
- [ ] Upload unit images
- [ ] Set primary image
- [ ] Delete images

**Estimated effort:** 1-2 days

### 8.4 Staff Management (Owner)
**Status:** NOT STARTED

**Tasks:**
- [ ] View/add/remove property staff
- [ ] Assign roles (manager, technician, marketing)

**Estimated effort:** 2 days

### 8.5 Google Sign-In
**Status:** NOT STARTED (package included, button shown, but backend endpoint missing)

**Tasks:**
- [ ] Backend: Create `POST /api/auth/google/mobile` endpoint
- [ ] Flutter: Implement GoogleSignIn flow
- [ ] Handle token exchange (Google idToken → JWT)

**Backend Change Required:** New endpoint to accept mobile Google idToken

**Estimated effort:** 1-2 days

---

## Phase 9: Testing (Priority: HIGH - Parallel with above)

### 9.1 Unit Tests
**Status:** NOT STARTED (0 test files exist)

**Tasks:**
- [ ] Test all repository implementations (mock Dio)
- [ ] Test all providers/notifiers (mock repositories)
- [ ] Test validators and formatters
- [ ] Test auth state machine

**Target:** 80%+ coverage on domain + application layers

**Estimated effort:** 3-4 days

### 9.2 Widget Tests
**Status:** NOT STARTED

**Tasks:**
- [ ] Test login form validation and submission
- [ ] Test dashboard rendering with mock data
- [ ] Test payment flow screens
- [ ] Test maintenance create form
- [ ] Test navigation between screens

**Estimated effort:** 2-3 days

### 9.3 Integration Tests
**Status:** NOT STARTED

**Tasks:**
- [ ] Full login → dashboard → pay rent flow
- [ ] Login → create maintenance request flow
- [ ] Owner login → view properties → manage tenants flow

**Estimated effort:** 2 days

---

## Phase 10: Production Readiness (Priority: HIGH - Before Release)

### 10.1 App Configuration
**Status:** NOT STARTED

- [ ] Configure app name, bundle ID, icons
- [ ] Create app icons (1024x1024) from Enderase logo
- [ ] Create splash screen (native) with flutter_native_splash
- [ ] Configure deep linking scheme
- [ ] Set up environment configs (dev, staging, prod)

### 10.2 Security
**Status:** PARTIAL (auth interceptor done, rest not started)

- [x] Auth interceptor attaches Bearer token to all API calls
- [x] JWT stored in FlutterSecureStorage (not SharedPreferences)
- [ ] Audit all API calls for proper auth headers
- [ ] Ensure no sensitive data in logs
- [ ] Certificate pinning for production API
- [ ] ProGuard rules for Android release
- [ ] Biometric auth option for app unlock

### 10.3 Performance
**Status:** NOT STARTED

- [ ] Profile with Flutter DevTools
- [ ] Optimize large list rendering (ListView.builder everywhere)
- [ ] Lazy load images
- [ ] Minimize rebuilds (select specific provider values)

### 10.4 Store Submission
**Status:** NOT STARTED

- [ ] App Store screenshots (6.7", 5.5")
- [ ] Play Store screenshots + feature graphic
- [ ] Privacy policy URL
- [ ] App description in English + Amharic
- [ ] Beta testing via TestFlight / Internal Track

---

## Recommended Priority Order

| # | Phase | Description | Effort | Status |
|---|-------|-------------|--------|--------|
| 1 | 4.1 | Owner Dashboard Backend | 2-3 days | NOT STARTED |
| 2 | 5.1 | Edit Profile | 1 day | NOT STARTED |
| 3 | 5.2 | Dark Mode | 0.5 days | NOT STARTED |
| 4 | 4.2 | Payment Approval (Owner) | 2 days | NOT STARTED |
| 5 | 7.1-7.2 | Shimmer + Pull-to-Refresh | 1.5 days | NOT STARTED |
| 6 | 4.3 | Tenant Management (Owner) | 3-4 days | NOT STARTED |
| 7 | 4.4 | Property CRUD (Owner) | 2-3 days | PARTIAL |
| 8 | 9.1 | Unit Tests | 3-4 days | NOT STARTED |
| 9 | 6.1 | Push Notifications (FCM) | 3-4 days | NOT STARTED |
| 10 | 5.3 | Amharic Localization | 3-4 days | NOT STARTED |
| 11 | 7.3 | Offline Caching | 3-4 days | NOT STARTED |
| 12 | 8.1-8.5 | Additional Features | 8-10 days | NOT STARTED |
| 13 | 9.2-9.3 | Widget + Integration Tests | 4-5 days | NOT STARTED |
| 14 | 10.x | Production Readiness | 3-4 days | PARTIAL |

**Total remaining effort: ~38-48 days**

---

## Already Completed (Phases 1-3)

### Phase 1: Foundation + Auth (COMPLETE)
- [x] Flutter project setup with all dependencies
- [x] Dio HTTP client with auth interceptor
- [x] GoRouter with role-based auth guards
- [x] Material 3 theme (blue primary, web-aligned)
- [x] Shared widgets (loading, error, empty state)
- [x] Auth feature: Login, Register, Splash (animated)
- [x] JWT secure storage with auto-login
- [x] Animated splash screen with gradient background

### Phase 2: Tenant Features (COMPLETE)
- [x] Tenant Dashboard with gradient rent card, lease status, quick actions
- [x] Lease Detail screen
- [x] Payment List with status filters and pagination
- [x] Pay Rent screen with gateway selector
- [x] Payment WebView for checkout
- [x] Payment Result screen (success/failure)
- [x] Bank Transfer screen with receipt upload
- [x] Payment Detail screen
- [x] Maintenance List with priority filters
- [x] Create Maintenance Request with image upload
- [x] Maintenance Detail with status timeline
- [x] Submit Feedback screen

### Phase 3: Core Owner + Extras (MOSTLY COMPLETE)
- [x] Property List and Detail screens
- [x] Notification List with type icons, mark as read
- [x] Owner Dashboard UI shell with stats cards
- [x] Settings screen UI shell
- [x] Pencil designs for all 11 screens
- [x] Web-aligned color palette (blue primary, Tailwind grays)

---

## Next Immediate Steps

1. **Owner Dashboard Backend Layer** - Connect stats to real API data (highest impact)
2. **Edit Profile Screen** - Quick win, completes settings feature
3. **Dark Mode Toggle** - Quick win, high user impact
4. **Payment Approval Flow** - Critical for owner workflow
5. **Shimmer Loading** - Replace loading spinners with skeleton screens
