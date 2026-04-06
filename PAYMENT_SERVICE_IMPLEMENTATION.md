# PaymentService Implementation Guide 💳

## Overview

PaymentService is the **4th service** in our service layer refactoring journey and represents one of the two **complex services** (along with PropertyService). It handles all payment-related operations including external API integration with Chapa payment gateway.

**Status:** ✅ Complete
**Complexity:** Complex (External API Integration)
**Lines of Code:** 368 lines
**Methods:** 8
**Controller Reduction:** **63%** (375 → 138 lines) 🏆 **HIGHEST REDUCTION**

---

## Table of Contents

1. [Architecture](#architecture)
2. [Implementation Details](#implementation-details)
3. [DTOs](#dtos)
4. [Service Methods](#service-methods)
5. [Controller Refactoring](#controller-refactoring)
6. [Routes Configuration](#routes-configuration)
7. [Business Rules](#business-rules)
8. [External API Integration](#external-api-integration)
9. [Testing](#testing)
10. [Key Learnings](#key-learnings)

---

## Architecture

### Before (Procedural)
```
Request → paymentController (everything) → Models → Database
                    ↓
           Chapa API Calls
```

**Problems:**
- 375 lines in controller
- Business logic mixed with HTTP logic
- Chapa integration tightly coupled
- Hard to test without making API calls
- No validation
- Inconsistent error handling

### After (Service Layer)
```
Request → DTO Validation → Controller → Service → Models → Database
                                          ↓
                                   Chapa API (via chapaService)
```

**Benefits:**
- 138 lines in controller (63% reduction)
- Business logic in service
- Chapa integration abstracted
- Easy to test (mock chapaService)
- Type-safe DTOs
- Centralized error handling

---

## Implementation Details

### File Structure

```
server/src/
├── application/
│   ├── dto/
│   │   └── payment/
│   │       ├── InitializePaymentDto.ts      ✅ NEW
│   │       └── CreateManualPaymentDto.ts    ✅ NEW
│   │
│   └── services/
│       └── PaymentService.ts                ✅ NEW (368 lines)
│
├── controllers/
│   └── paymentController.ts                 ✅ REFACTORED (375 → 138 lines)
│
└── routes/
    └── paymentRoutes.ts                     ✅ UPDATED (uses DTOs)
```

---

## DTOs

### 1. InitializePaymentDto

**Purpose:** Validate data for Chapa payment initialization

**File:** `application/dto/payment/InitializePaymentDto.ts`

```typescript
import { IsMongoId, IsNumber, IsInt, IsEnum, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class InitializePaymentDto {
  @IsMongoId({ message: 'Invalid tenant ID' })
  tenantId!: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be greater than 0' })
  amount!: number;

  @IsEnum(['rent', 'deposit', 'maintenance', 'utility', 'penalty'], {
    message: 'Type must be one of: rent, deposit, maintenance, utility, penalty',
  })
  type!: string;

  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  month!: number;

  @IsInt({ message: 'Year must be an integer' })
  @Min(2020, { message: 'Year must be 2020 or later' })
  year!: number;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;
}
```

**Validations:**
- ✅ Tenant ID must be valid MongoDB ObjectId
- ✅ Amount must be positive number
- ✅ Type must be one of 5 payment types
- ✅ Month must be 1-12
- ✅ Year must be 2020 or later
- ✅ Due date optional but must be valid ISO date string

### 2. CreateManualPaymentDto

**Purpose:** Validate data for manual payment recording (cash/bank transfer)

**File:** `application/dto/payment/CreateManualPaymentDto.ts`

```typescript
import { IsMongoId, IsNumber, IsInt, IsEnum, IsOptional, IsDateString, IsString, Min, Max } from 'class-validator';

export class CreateManualPaymentDto {
  @IsMongoId({ message: 'Invalid tenant ID' })
  tenantId!: string;

  @IsNumber({}, { message: 'Amount must be a number' })
  @Min(1, { message: 'Amount must be greater than 0' })
  amount!: number;

  @IsEnum(['rent', 'deposit', 'maintenance', 'utility', 'penalty'], {
    message: 'Type must be one of: rent, deposit, maintenance, utility, penalty',
  })
  type!: string;

  @IsInt({ message: 'Month must be an integer' })
  @Min(1, { message: 'Month must be between 1 and 12' })
  @Max(12, { message: 'Month must be between 1 and 12' })
  month!: number;

  @IsInt({ message: 'Year must be an integer' })
  @Min(2020, { message: 'Year must be 2020 or later' })
  year!: number;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid date' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
```

**Additional Field:**
- ✅ Optional notes field for manual payment details

---

## Service Methods

### PaymentService Class

**Models Injected:**
- `Payment` (primary model)
- `Tenant` (for validation)
- `User` (for email lookup)

**External Service:**
- `chapaService` (imported, not injected - singleton)

### 1. initializePayment()

**Purpose:** Initialize payment with Chapa gateway and create pending payment record

```typescript
async initializePayment(data: InitializePaymentData): Promise<InitializePaymentResult>
```

**Business Logic:**
1. Validate tenant exists and get populated relations
2. Verify user exists (email required by Chapa)
3. Generate unique transaction reference
4. Create pending payment record in database
5. Parse user name into first/last for Chapa
6. Initialize Chapa payment with all required data
7. Return payment record and checkout URL

**Error Handling:**
- Throws `NotFoundError` if tenant not found
- Throws `NotFoundError` if user not found
- Propagates Chapa API errors

**Key Features:**
- Transaction reference: `PMS-{timestamp}-{random}`
- Status starts as 'pending'
- Includes callback and return URLs
- Custom Chapa title and description

### 2. verifyPayment()

**Purpose:** Verify payment with Chapa and update status

```typescript
async verifyPayment(txRef: string): Promise<IPayment>
```

**Business Logic:**
1. Call Chapa verify endpoint
2. If failed, update payment status to 'failed' and throw error
3. If successful, generate receipt number
4. Update payment with 'completed' status, reference, and receipt
5. Return updated payment

**Error Handling:**
- Throws `NotFoundError` if payment not found
- Throws `BadRequestError` if verification fails
- Propagates Chapa API errors

**Key Features:**
- Atomic status updates
- Auto-generated receipts: `RCP-{timestamp}-{random}`
- Records paidAt timestamp

### 3. handleWebhook()

**Purpose:** Process Chapa webhook callbacks (async notifications)

```typescript
async handleWebhook(data: WebhookData): Promise<void>
```

**Business Logic:**
1. Extract tx_ref, status, and reference from webhook
2. If status is 'success', update to completed with receipt
3. If status is not 'success', update to failed
4. No return value (fire-and-forget pattern)

**Error Handling:**
- Silent failures (webhooks shouldn't fail requests)
- Logs handled by controller

**Key Features:**
- Idempotent (can be called multiple times)
- Async payment confirmation
- Generates receipt on success

### 4. getPayments()

**Purpose:** List payments with role-based filtering and pagination

```typescript
async getPayments(userId: string, userRole: string, options: PaymentQueryOptions)
```

**Business Logic:**
1. Build query based on user role:
   - **Owner/Admin**: See all payments for their properties
   - **Tenant**: See only their own payments
2. Apply additional filters (status, type, property, month, year)
3. Paginate results
4. Populate related data (tenant, unit, property)
5. Return payments with pagination metadata

**Role-Based Access:**
- Owners see: `{ ownerId: userId }`
- Tenants see: `{ tenantId: activeTenantId }`
- If tenant has no active tenancy, return empty results

**Key Features:**
- Dynamic query building
- Population of nested relations
- Descending sort (newest first)
- Pagination with total count

### 5. getPayment()

**Purpose:** Get single payment by ID with populated relations

```typescript
async getPayment(paymentId: string): Promise<IPayment>
```

**Business Logic:**
1. Find payment by ID
2. Populate tenant, unit, and property details
3. Return populated payment

**Error Handling:**
- Throws `NotFoundError` if payment not found

**Key Features:**
- Full relation population
- Ready for detailed views

### 6. createManualPayment()

**Purpose:** Record manual payment (cash/bank transfer) by owner

```typescript
async createManualPayment(data: CreateManualPaymentData): Promise<IPayment>
```

**Business Logic:**
1. Verify tenant belongs to owner
2. Generate receipt number
3. Create payment with 'completed' status
4. Set payment method as 'manual'
5. Record paidAt as current time
6. Return created payment

**Error Handling:**
- Throws `NotFoundError` if tenant not found or doesn't belong to owner

**Key Features:**
- Owner-only operation
- Instant completion (no pending state)
- Auto-generated receipts
- Supports notes field

### 7. getPaymentStats()

**Purpose:** Get payment analytics for owner dashboard

```typescript
async getPaymentStats(ownerId: string, year?: number)
```

**Business Logic:**
1. Default to current year if not specified
2. Run two aggregations:
   - **Monthly stats**: Group by month and status
   - **Summary**: Group by status only
3. Calculate totals and counts
4. Return both datasets

**Aggregation Pipeline:**
- Match by owner and year
- Group by month/status or status
- Sum amounts and count documents
- Sort by month

**Key Features:**
- MongoDB aggregation
- Flexible year filtering
- Dual-dataset response
- Performance optimized

### 8. generateReceiptNumber()

**Purpose:** Generate unique receipt numbers

```typescript
private generateReceiptNumber(): string
```

**Algorithm:**
- Format: `RCP-{timestamp}-{random}`
- Timestamp: milliseconds since epoch
- Random: 4 uppercase alphanumeric characters

**Uniqueness:**
- Timestamp ensures chronological ordering
- Random suffix prevents collisions

---

## Controller Refactoring

### Metrics

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lines | 375 | 138 | **-237 (63%)** 🏆 |
| Methods | 7 | 7 | 0 |
| Avg Lines/Method | 53 | 19 | -34 |
| Business Logic | Mixed | Extracted | ✅ |
| Error Handling | Manual | Delegated | ✅ |

### Controller Pattern

**Before:**
```typescript
export const initializePayment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 80+ lines of business logic
    // Tenant validation
    // User lookup
    // Chapa integration
    // Error handling
    res.json({ ... });
  } catch (error) {
    console.error('Initialize payment error:', error);
    res.status(500).json({ success: false, message: 'Failed...' });
  }
};
```

**After:**
```typescript
export const initializePayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await paymentService.initializePayment(req.body);
    res.json({
      success: true,
      message: 'Payment initialized',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
```

**Improvements:**
- ✅ 80+ lines → 9 lines
- ✅ No business logic in controller
- ✅ Consistent response format
- ✅ Error handling delegated to middleware
- ✅ Easy to understand flow

---

## Routes Configuration

### Updated Routes

**File:** `routes/paymentRoutes.ts`

**Before:**
```typescript
import { body } from 'express-validator';
import { validate } from '../middleware/validate.js';

router.post('/initialize',
  authenticate,
  validate([
    body('tenantId').notEmpty().withMessage('Tenant ID is required'),
    body('amount').isFloat({ min: 1 }).withMessage('Amount must be greater than 0'),
    // ... more validations
  ]),
  paymentController.initializePayment
);
```

**After:**
```typescript
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { InitializePaymentDto } from '../application/dto/payment/InitializePaymentDto.js';

router.post('/initialize',
  authenticate,
  ValidationMiddleware.validate(InitializePaymentDto),
  paymentController.initializePayment
);
```

**Benefits:**
- ✅ Type-safe validation
- ✅ Centralized validation logic
- ✅ Reusable DTOs
- ✅ Self-documenting
- ✅ Cleaner route definitions

---

## Business Rules

PaymentService enforces **9 core business rules:**

### 1. Tenant Existence Validation
- Payment can only be created for existing tenants
- Tenant must be active and associated with a property

### 2. User Email Requirement
- Chapa requires user email for payment initialization
- Service verifies user exists before calling Chapa

### 3. Transaction Reference Generation
- Unique reference for each transaction
- Format: `PMS-{timestamp}-{random}`
- Used for idempotency and tracking

### 4. Receipt Number Generation
- Auto-generated for completed payments
- Format: `RCP-{timestamp}-{random}`
- Chronologically sortable

### 5. Role-Based Payment Filtering
- **Owners/Admins**: See all payments for their properties
- **Tenants**: See only their own payments
- Empty results for inactive tenants

### 6. Payment Status Management
- **Pending**: Payment initialized, waiting confirmation
- **Completed**: Payment verified and successful
- **Failed**: Payment verification failed
- **Refunded**: Payment was refunded (future use)

### 7. Chapa Webhook Handling
- Process async notifications from Chapa
- Update payment status atomically
- Idempotent operations

### 8. Payment Verification
- Verify payment with Chapa before marking complete
- Generate receipt only on successful verification
- Record payment timestamp

### 9. Owner-Tenant Relationship Validation
- Manual payments require tenant to belong to owner
- Prevents unauthorized payment recording
- Ownership verified at service level

---

## External API Integration

### Chapa Payment Gateway

**Service Used:** `chapaService` (singleton in `config/chapa.ts`)

**API Endpoints:**
1. **Initialize**: `POST /transaction/initialize`
2. **Verify**: `GET /transaction/verify/:txRef`
3. **Webhook**: `POST /webhook` (callback from Chapa)

### Integration Pattern

```typescript
// Service depends on chapaService but doesn't inject it
import { chapaService } from '../../config/chapa.js';

// Use in service methods
const chapaResponse = await chapaService.initializePayment({
  amount,
  currency: 'ETB',
  email: user.email,
  // ... more params
});
```

**Why Not Injected?**
- chapaService is a singleton (single API key)
- No need for multiple instances
- Simplifies service instantiation
- Still testable (can mock the import)

### Error Handling

**Chapa Errors:**
- Network failures
- Invalid API key
- Invalid parameters
- Transaction not found

**Service Response:**
- Propagates Chapa errors up to controller
- Controller delegates to error handler middleware
- Client gets structured error response

### Environment Variables

```env
CHAPA_SECRET_KEY=your_secret_key
BASE_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173
```

**Used For:**
- API authentication (secret key)
- Webhook callback URL (BASE_URL)
- Payment success redirect (FRONTEND_URL)

---

## Testing

### Manual Test Cases

#### 1. Initialize Payment
```bash
POST /api/payments/initialize
Authorization: Bearer {tenant_token}
Content-Type: application/json

{
  "tenantId": "507f1f77bcf86cd799439011",
  "amount": 5000,
  "type": "rent",
  "month": 2,
  "year": 2024,
  "dueDate": "2024-02-05"
}

Expected: 200 OK
{
  "success": true,
  "message": "Payment initialized",
  "data": {
    "payment": { ... },
    "checkoutUrl": "https://checkout.chapa.co/..."
  }
}
```

#### 2. Verify Payment
```bash
GET /api/payments/verify/PMS-1234567890-ABC123

Expected: 200 OK
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "_id": "...",
    "status": "completed",
    "receipt": {
      "number": "RCP-1234567890-XYZ9",
      "generatedAt": "2024-02-04T..."
    }
  }
}
```

#### 3. Create Manual Payment
```bash
POST /api/payments/manual
Authorization: Bearer {owner_token}
Content-Type: application/json

{
  "tenantId": "507f1f77bcf86cd799439011",
  "amount": 3000,
  "type": "deposit",
  "month": 2,
  "year": 2024,
  "notes": "Received cash deposit"
}

Expected: 201 Created
{
  "success": true,
  "message": "Manual payment recorded",
  "data": {
    "status": "completed",
    "paymentMethod": "manual",
    "receipt": { ... }
  }
}
```

#### 4. Get Payments (Owner)
```bash
GET /api/payments?page=1&limit=10&status=completed&propertyId=...
Authorization: Bearer {owner_token}

Expected: 200 OK
{
  "success": true,
  "data": {
    "payments": [ ... ],
    "pagination": {
      "total": 25,
      "page": 1,
      "limit": 10,
      "pages": 3
    }
  }
}
```

#### 5. Get Payment Stats
```bash
GET /api/payments/stats/summary?year=2024
Authorization: Bearer {owner_token}

Expected: 200 OK
{
  "success": true,
  "data": {
    "monthlyStats": [
      { "_id": { "month": 1, "status": "completed" }, "total": 50000, "count": 10 },
      ...
    ],
    "summary": [
      { "_id": "completed", "total": 150000, "count": 30 },
      { "_id": "pending", "total": 10000, "count": 2 }
    ]
  }
}
```

### Error Cases

#### Invalid Tenant ID
```bash
POST /api/payments/initialize
{ "tenantId": "invalid", ... }

Expected: 400 Bad Request
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed: Invalid tenant ID"
}
```

#### Tenant Not Found
```bash
POST /api/payments/initialize
{ "tenantId": "507f1f77bcf86cd799439099", ... }

Expected: 404 Not Found
{
  "success": false,
  "code": "NOT_FOUND",
  "message": "Tenant with ID 507f1f77bcf86cd799439099 not found"
}
```

#### Unauthorized Manual Payment
```bash
POST /api/payments/manual
Authorization: Bearer {tenant_token}

Expected: 403 Forbidden
{
  "success": false,
  "message": "Access denied"
}
```

---

## Key Learnings

### What Worked Extremely Well

#### 1. External API Abstraction ✅
- Chapa integration isolated in separate service
- Easy to mock for testing
- Can swap payment providers without changing PaymentService
- **Lesson**: Abstract external APIs early

#### 2. Dual Payment Methods ✅
- Both Chapa (online) and manual (cash) supported
- Different flows for different payment methods
- Owner can record offline payments
- **Lesson**: Support multiple payment channels

#### 3. Webhook Pattern ✅
- Async payment confirmation via webhooks
- Idempotent operations (can retry safely)
- No blocking operations
- **Lesson**: Webhooks improve reliability for async operations

#### 4. Receipt Generation ✅
- Auto-generated unique receipts
- Timestamp-based for chronological ordering
- Random suffix prevents collisions
- **Lesson**: Generate receipts server-side for consistency

#### 5. Role-Based Filtering ✅
- Different views for owners vs tenants
- Encapsulated in service layer
- No authorization logic in controller
- **Lesson**: Role-based access belongs in service

### Challenges Overcome

#### 1. Transaction Reference Uniqueness ✅
**Problem:** Need unique references for Chapa and internal tracking
**Solution:** `PMS-{timestamp}-{random}` format
**Benefit:** Unique, trackable, chronologically sortable

#### 2. Webhook Idempotency ✅
**Problem:** Chapa may retry webhook calls
**Solution:** Use `findOneAndUpdate` for atomic operations
**Benefit:** Safe to process same webhook multiple times

#### 3. Payment Verification Flow ✅
**Problem:** Need both sync (verify endpoint) and async (webhook) confirmation
**Solution:** Support both paths, update status atomically
**Benefit:** Reliable payment confirmation

#### 4. Role-Based Payment Access ✅
**Problem:** Owners see all properties, tenants see only own
**Solution:** Dynamic query building in service
**Benefit:** Single method handles both roles

#### 5. Manual vs Chapa Payments ✅
**Problem:** Different flows for different payment methods
**Solution:** Separate service methods with clear distinctions
**Benefit:** Clean separation of concerns

### Patterns Established

#### 1. External API Integration Pattern
```typescript
// Import singleton service
import { externalService } from '../../config/external.js';

// Use in service methods
const result = await externalService.callAPI(params);

// Service layer wraps external calls
// Controller never touches external APIs
```

#### 2. Webhook Handling Pattern
```typescript
// Webhook endpoint (no auth required)
router.post('/webhook', controller.handleWebhook);

// Idempotent service method
async handleWebhook(data: WebhookData): Promise<void> {
  // Atomic update
  await this.model.findOneAndUpdate({ txRef }, { status });
}
```

#### 3. Dual Authentication Pattern
```typescript
// Online payment (tenant or owner)
router.post('/initialize', authenticate, ...);

// Manual payment (owner only)
router.post('/manual', authenticate, authorize('owner'), ...);
```

#### 4. Analytics Aggregation Pattern
```typescript
// MongoDB aggregation in service
const stats = await this.model.aggregate([
  { $match: { ownerId, year } },
  { $group: { _id: '$month', total: { $sum: '$amount' } } },
  { $sort: { '_id': 1 } }
]);
```

### Performance Considerations

#### 1. Pagination ✅
- All list endpoints support pagination
- Default limit: 10
- Prevents large dataset queries
- **Impact**: Fast response times

#### 2. Selective Population ✅
- Only populate required fields
- Example: `populate('unitId', 'unitNumber floor')`
- **Impact**: Reduced payload size

#### 3. Aggregation Optimization ✅
- Use MongoDB aggregation for stats
- Single query instead of multiple
- **Impact**: Fast dashboard loading

#### 4. Index Usage ✅
- Payment model has indexes on:
  - `tenantId`
  - `ownerId`
  - `chapaTxRef`
  - Composite: `(tenantId, month, year)`
- **Impact**: Fast queries on filtered data

---

## Comparison with Other Services

| Metric | Auth | Tenant | Property | Payment |
|--------|------|--------|----------|---------|
| **Lines** | 170 | 245 | 442 | **368** |
| **Methods** | 5 | 6 | 14 | **8** |
| **Reduction** | 41% | 49% | 43% | **63%** 🏆 |
| **Models** | 1 | 4 | 3 | **3** |
| **External APIs** | 0 | 0 | 0 | **1 (Chapa)** |
| **Complexity** | Simple | Medium | Complex | **Complex** |

**PaymentService Highlights:**
- 🏆 **Highest controller reduction** (63%)
- 🌐 **Only service with external API** (Chapa)
- 🔄 **Supports webhooks** (async operations)
- 📊 **Includes analytics** (aggregation queries)
- 💰 **Dual payment methods** (online + manual)

---

## Next Steps

With PaymentService complete, we've achieved:
- ✅ **4/6 services implemented** (67% complete)
- ✅ **Both complex services done** (Property + Payment)
- ✅ **49% overall controller reduction**
- ✅ **External API integration pattern established**

**Remaining Services:**
1. **MaintenanceService** (Medium complexity)
2. **WaitingListService** (Simple complexity)

**Estimated Remaining Effort:** 2-3 hours

---

## Summary

PaymentService successfully:
- ✅ Reduced controller from 375 to 138 lines (**63% reduction**)
- ✅ Integrated Chapa payment gateway with proper abstraction
- ✅ Implemented webhook handling for async payments
- ✅ Created dual payment methods (online + manual)
- ✅ Built analytics with MongoDB aggregation
- ✅ Enforced role-based access at service level
- ✅ Generated unique receipts and transaction references
- ✅ Maintained consistent error handling patterns

**Pattern is rock solid. Two more services to go!** 🚀

---

*Created: 2026-02-04*
*Service: 4/6 Complete*
*Progress: 67%* 🎊
