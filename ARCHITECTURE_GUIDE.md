# Property Management System - Architecture Guide

## Executive Summary

This document provides a comprehensive guide to refactor the PMS application following SOLID principles, Object-Oriented Programming (OOP) best practices, and scalable architecture patterns.

---

## Current Issues & Recommendations

### 1. Critical Bug: Port Mismatch
**Issue**: Client proxies to port 5001, but server runs on port 5000
**Fix**: Update `client/vite.config.ts` line 10 to use port 5000

```typescript
target: 'http://localhost:5000', // Changed from 5001
```

---

## Proposed Architecture: Layered Architecture with Clean Architecture Principles

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│              (Controllers, DTOs, Validators)             │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                   Application Layer                      │
│         (Services, Use Cases, Business Logic)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                    Domain Layer                          │
│         (Entities, Value Objects, Interfaces)            │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               Infrastructure Layer                       │
│     (Repositories, External Services, Database)          │
└─────────────────────────────────────────────────────────┘
```

---

## SOLID Principles Implementation

### S - Single Responsibility Principle

**Current Violation:**
```typescript
// authController.ts - Does too much
export const register = async (req, res) => {
  // 1. Validates input
  // 2. Checks for existing user
  // 3. Creates user
  // 4. Generates token
  // 5. Formats response
};
```

**Proposed Solution:**
```typescript
// src/presentation/controllers/AuthController.ts
export class AuthController {
  constructor(
    private authService: IAuthService,
    private validator: IValidator
  ) {}

  async register(req: Request, res: Response): Promise<void> {
    const dto = await this.validator.validate(RegisterDto, req.body);
    const result = await this.authService.register(dto);
    res.status(201).json(result);
  }
}

// src/application/services/AuthService.ts
export class AuthService implements IAuthService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: ITokenService,
    private passwordHasher: IPasswordHasher
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponse> {
    // Business logic only
  }
}
```

---

### O - Open/Closed Principle

**Problem**: Adding new payment methods requires modifying existing code

**Solution**: Strategy Pattern for Payment Processing

```typescript
// src/domain/interfaces/IPaymentProcessor.ts
export interface IPaymentProcessor {
  processPayment(payment: Payment): Promise<PaymentResult>;
  verifyPayment(reference: string): Promise<PaymentStatus>;
}

// src/infrastructure/payment/ChapaPaymentProcessor.ts
export class ChapaPaymentProcessor implements IPaymentProcessor {
  async processPayment(payment: Payment): Promise<PaymentResult> {
    // Chapa-specific logic
  }
}

// src/infrastructure/payment/StripePaymentProcessor.ts
export class StripePaymentProcessor implements IPaymentProcessor {
  async processPayment(payment: Payment): Promise<PaymentResult> {
    // Stripe-specific logic
  }
}

// src/infrastructure/payment/PaymentProcessorFactory.ts
export class PaymentProcessorFactory {
  create(method: PaymentMethod): IPaymentProcessor {
    switch(method) {
      case 'chapa': return new ChapaPaymentProcessor();
      case 'stripe': return new StripePaymentProcessor();
      default: throw new Error('Unsupported payment method');
    }
  }
}
```

---

### L - Liskov Substitution Principle

**Problem**: Tight coupling to Mongoose models

**Solution**: Repository interfaces

```typescript
// src/domain/interfaces/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: CreateUserData): Promise<User>;
  update(id: string, data: UpdateUserData): Promise<User>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/repositories/MongoUserRepository.ts
export class MongoUserRepository implements IUserRepository {
  constructor(private userModel: Model<IUser>) {}

  async findById(id: string): Promise<User | null> {
    const doc = await this.userModel.findById(id);
    return doc ? this.toDomain(doc) : null;
  }

  private toDomain(doc: Document): User {
    return new User({
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      // ... map to domain entity
    });
  }
}

// Easy to swap with different implementation
export class PostgresUserRepository implements IUserRepository {
  // Same interface, different implementation
}
```

---

### I - Interface Segregation Principle

**Problem**: Fat interfaces force implementations to depend on methods they don't use

**Solution**: Small, focused interfaces

```typescript
// Bad - Single fat interface
interface IRepository<T> {
  find(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<void>;
  bulkCreate(data: any[]): Promise<T[]>;
  bulkUpdate(updates: any[]): Promise<void>;
  transaction(callback: Function): Promise<any>;
}

// Good - Segregated interfaces
interface IReadRepository<T> {
  findById(id: string): Promise<T | null>;
  find(query: QueryOptions): Promise<T[]>;
}

interface IWriteRepository<T> {
  create(data: CreateData<T>): Promise<T>;
  update(id: string, data: UpdateData<T>): Promise<T>;
  delete(id: string): Promise<void>;
}

interface IBulkRepository<T> {
  bulkCreate(data: CreateData<T>[]): Promise<T[]>;
  bulkUpdate(updates: BulkUpdate<T>[]): Promise<void>;
}

// Use only what you need
export class TenantService {
  constructor(
    private tenantRepo: IReadRepository<Tenant> & IWriteRepository<Tenant>
  ) {}
}
```

---

### D - Dependency Inversion Principle

**Problem**: High-level modules depend on low-level modules

**Solution**: Dependency Injection Container

```typescript
// src/infrastructure/di/container.ts
import { Container } from 'inversify';
import { TYPES } from './types';

const container = new Container();

// Bind interfaces to implementations
container.bind<IUserRepository>(TYPES.IUserRepository)
  .to(MongoUserRepository)
  .inSingletonScope();

container.bind<IAuthService>(TYPES.IAuthService)
  .to(AuthService)
  .inRequestScope();

container.bind<ITokenService>(TYPES.ITokenService)
  .to(JwtTokenService)
  .inSingletonScope();

export { container };

// src/presentation/controllers/AuthController.ts
@injectable()
export class AuthController {
  constructor(
    @inject(TYPES.IAuthService) private authService: IAuthService
  ) {}
}
```

---

## Proposed Directory Structure

```
server/src/
├── domain/                         # Core business logic (framework-independent)
│   ├── entities/                   # Domain entities
│   │   ├── User.ts
│   │   ├── Property.ts
│   │   ├── Tenant.ts
│   │   └── Payment.ts
│   ├── value-objects/              # Immutable value objects
│   │   ├── Email.ts
│   │   ├── Address.ts
│   │   ├── Money.ts
│   │   └── DateRange.ts
│   ├── interfaces/                 # Contracts/Abstractions
│   │   ├── repositories/
│   │   │   ├── IUserRepository.ts
│   │   │   ├── IPropertyRepository.ts
│   │   │   └── ITenantRepository.ts
│   │   └── services/
│   │       ├── IAuthService.ts
│   │       ├── IPaymentService.ts
│   │       └── INotificationService.ts
│   ├── events/                     # Domain events
│   │   ├── UserRegistered.ts
│   │   ├── PaymentReceived.ts
│   │   └── TenantAdded.ts
│   └── exceptions/                 # Domain exceptions
│       ├── DomainException.ts
│       ├── UserNotFound.ts
│       └── InsufficientPermissions.ts
│
├── application/                    # Application services & use cases
│   ├── services/                   # Application services
│   │   ├── AuthService.ts
│   │   ├── PropertyService.ts
│   │   ├── TenantService.ts
│   │   └── PaymentService.ts
│   ├── use-cases/                  # Specific use cases
│   │   ├── RegisterUser.ts
│   │   ├── CreateProperty.ts
│   │   ├── AddTenant.ts
│   │   └── ProcessPayment.ts
│   ├── dto/                        # Data Transfer Objects
│   │   ├── auth/
│   │   │   ├── RegisterDto.ts
│   │   │   └── LoginDto.ts
│   │   ├── property/
│   │   └── tenant/
│   └── validators/                 # Input validation
│       ├── AuthValidator.ts
│       └── PropertyValidator.ts
│
├── infrastructure/                 # External concerns
│   ├── database/
│   │   ├── mongoose/
│   │   │   ├── schemas/           # Mongoose schemas
│   │   │   └── connection.ts
│   │   └── migrations/            # Database migrations
│   ├── repositories/              # Repository implementations
│   │   ├── MongoUserRepository.ts
│   │   ├── MongoPropertyRepository.ts
│   │   └── MongoTenantRepository.ts
│   ├── external-services/         # Third-party integrations
│   │   ├── payment/
│   │   │   ├── ChapaPaymentGateway.ts
│   │   │   └── StripePaymentGateway.ts
│   │   ├── storage/
│   │   │   └── CloudinaryStorage.ts
│   │   ├── email/
│   │   │   └── SendGridEmailService.ts
│   │   └── sms/
│   │       └── TwilioSmsService.ts
│   ├── auth/                      # Authentication infrastructure
│   │   ├── JwtTokenService.ts
│   │   ├── GoogleOAuthStrategy.ts
│   │   └── PasswordHasher.ts
│   ├── logging/
│   │   └── WinstonLogger.ts
│   └── di/                        # Dependency injection
│       ├── container.ts
│       └── types.ts
│
├── presentation/                   # API/HTTP layer
│   ├── controllers/               # HTTP controllers
│   │   ├── AuthController.ts
│   │   ├── PropertyController.ts
│   │   ├── TenantController.ts
│   │   └── PaymentController.ts
│   ├── middleware/                # Express middleware
│   │   ├── AuthMiddleware.ts
│   │   ├── ErrorMiddleware.ts
│   │   ├── ValidationMiddleware.ts
│   │   └── RateLimitMiddleware.ts
│   ├── routes/                    # Route definitions
│   │   ├── authRoutes.ts
│   │   ├── propertyRoutes.ts
│   │   └── index.ts
│   └── transformers/              # Response transformers
│       ├── UserTransformer.ts
│       └── PropertyTransformer.ts
│
├── shared/                        # Shared utilities
│   ├── utils/
│   ├── constants/
│   └── types/
│
└── index.ts                       # Application entry point
```

---

## Design Patterns to Implement

### 1. Repository Pattern

**Purpose**: Abstracts data access logic

```typescript
// src/domain/interfaces/repositories/IPropertyRepository.ts
export interface IPropertyRepository {
  findById(id: string): Promise<Property | null>;
  findByOwner(ownerId: string, options: QueryOptions): Promise<PaginatedResult<Property>>;
  save(property: Property): Promise<Property>;
  delete(id: string): Promise<void>;
}

// src/infrastructure/repositories/MongoPropertyRepository.ts
export class MongoPropertyRepository implements IPropertyRepository {
  constructor(private propertyModel: Model<IPropertyDocument>) {}

  async findById(id: string): Promise<Property | null> {
    const doc = await this.propertyModel.findById(id).lean();
    return doc ? PropertyMapper.toDomain(doc) : null;
  }

  async save(property: Property): Promise<Property> {
    const exists = await this.propertyModel.exists({ _id: property.id });

    if (exists) {
      const updated = await this.propertyModel.findByIdAndUpdate(
        property.id,
        PropertyMapper.toPersistence(property),
        { new: true }
      );
      return PropertyMapper.toDomain(updated!);
    } else {
      const created = await this.propertyModel.create(
        PropertyMapper.toPersistence(property)
      );
      return PropertyMapper.toDomain(created);
    }
  }
}
```

---

### 2. Unit of Work Pattern

**Purpose**: Manages transactions across multiple repositories

```typescript
// src/domain/interfaces/IUnitOfWork.ts
export interface IUnitOfWork {
  properties: IPropertyRepository;
  tenants: ITenantRepository;
  units: IUnitRepository;

  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

// src/infrastructure/database/MongoUnitOfWork.ts
export class MongoUnitOfWork implements IUnitOfWork {
  private session: ClientSession | null = null;

  constructor(
    public properties: IPropertyRepository,
    public tenants: ITenantRepository,
    public units: IUnitRepository
  ) {}

  async begin(): Promise<void> {
    this.session = await mongoose.startSession();
    this.session.startTransaction();
  }

  async commit(): Promise<void> {
    await this.session?.commitTransaction();
    this.session?.endSession();
  }

  async rollback(): Promise<void> {
    await this.session?.abortTransaction();
    this.session?.endSession();
  }
}

// Usage in service
export class TenantService {
  constructor(private uow: IUnitOfWork) {}

  async addTenant(dto: AddTenantDto): Promise<Tenant> {
    await this.uow.begin();
    try {
      const tenant = await this.uow.tenants.save(/* ... */);
      await this.uow.units.updateStatus(dto.unitId, 'occupied');
      await this.uow.commit();
      return tenant;
    } catch (error) {
      await this.uow.rollback();
      throw error;
    }
  }
}
```

---

### 3. Factory Pattern

**Purpose**: Centralizes object creation

```typescript
// src/domain/factories/TenantFactory.ts
export class TenantFactory {
  static create(dto: CreateTenantDto, ownerId: string): Tenant {
    return new Tenant({
      id: generateId(),
      userId: dto.userId,
      propertyId: dto.propertyId,
      unitId: dto.unitId,
      ownerId: ownerId,
      leaseAgreement: new LeaseAgreement({
        startDate: dto.leaseStart,
        endDate: dto.leaseEnd,
        monthlyRent: new Money(dto.rent, 'USD'),
        deposit: new Money(dto.deposit, 'USD')
      }),
      status: TenantStatus.Active,
      createdAt: new Date()
    });
  }

  static createFromWaitingList(
    application: WaitingListApplication,
    unit: Unit
  ): Tenant {
    // Different creation logic
  }
}
```

---

### 4. Domain Events Pattern

**Purpose**: Decouples domain logic through events

```typescript
// src/domain/events/DomainEvent.ts
export abstract class DomainEvent {
  public readonly occurredOn: Date;

  constructor() {
    this.occurredOn = new Date();
  }
}

// src/domain/events/TenantAddedEvent.ts
export class TenantAddedEvent extends DomainEvent {
  constructor(
    public readonly tenant: Tenant,
    public readonly property: Property
  ) {
    super();
  }
}

// src/domain/entities/Tenant.ts
export class Tenant extends AggregateRoot {
  private _events: DomainEvent[] = [];

  static create(data: CreateTenantData): Tenant {
    const tenant = new Tenant(data);
    tenant.addEvent(new TenantAddedEvent(tenant, data.property));
    return tenant;
  }

  private addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  getEvents(): DomainEvent[] {
    return this._events;
  }
}

// src/application/services/TenantService.ts
export class TenantService {
  constructor(
    private tenantRepo: ITenantRepository,
    private eventPublisher: IEventPublisher
  ) {}

  async addTenant(dto: AddTenantDto): Promise<Tenant> {
    const tenant = Tenant.create(dto);
    await this.tenantRepo.save(tenant);

    // Publish events
    for (const event of tenant.getEvents()) {
      await this.eventPublisher.publish(event);
    }

    return tenant;
  }
}

// src/application/event-handlers/TenantAddedHandler.ts
export class TenantAddedHandler implements IEventHandler<TenantAddedEvent> {
  constructor(
    private emailService: IEmailService,
    private notificationService: INotificationService
  ) {}

  async handle(event: TenantAddedEvent): Promise<void> {
    // Send welcome email
    await this.emailService.sendWelcomeEmail(event.tenant);

    // Notify owner
    await this.notificationService.notify(
      event.property.ownerId,
      `New tenant ${event.tenant.name} added`
    );
  }
}
```

---

## Error Handling Strategy

### Custom Exception Hierarchy

```typescript
// src/domain/exceptions/DomainException.ts
export abstract class DomainException extends Error {
  abstract statusCode: number;
  abstract code: string;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// src/domain/exceptions/NotFoundExceptions.ts
export class UserNotFoundException extends DomainException {
  statusCode = 404;
  code = 'USER_NOT_FOUND';

  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}

export class PropertyNotFoundException extends DomainException {
  statusCode = 404;
  code = 'PROPERTY_NOT_FOUND';

  constructor(propertyId: string) {
    super(`Property with ID ${propertyId} not found`);
  }
}

// src/domain/exceptions/ValidationExceptions.ts
export class ValidationException extends DomainException {
  statusCode = 400;
  code = 'VALIDATION_ERROR';

  constructor(public errors: ValidationError[]) {
    super('Validation failed');
  }
}

// src/domain/exceptions/BusinessRuleExceptions.ts
export class UnitNotAvailableException extends DomainException {
  statusCode = 409;
  code = 'UNIT_NOT_AVAILABLE';

  constructor(unitId: string) {
    super(`Unit ${unitId} is not available for rent`);
  }
}

// src/presentation/middleware/ErrorMiddleware.ts
export class ErrorMiddleware {
  static handle(err: Error, req: Request, res: Response, next: NextFunction) {
    if (err instanceof DomainException) {
      return res.status(err.statusCode).json({
        success: false,
        code: err.code,
        message: err.message,
        ...(err instanceof ValidationException && { errors: err.errors })
      });
    }

    // Log unexpected errors
    logger.error('Unexpected error:', err);

    return res.status(500).json({
      success: false,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred'
    });
  }
}
```

---

## Validation Strategy

```typescript
// src/application/dto/auth/RegisterDto.ts
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number'
  })
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/)
  phone?: string;
}

// src/presentation/middleware/ValidationMiddleware.ts
export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: ClassConstructor<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      const dto = plainToClass(dtoClass, req.body);
      const errors = await validate(dto);

      if (errors.length > 0) {
        const formattedErrors = errors.map(error => ({
          field: error.property,
          constraints: error.constraints
        }));

        throw new ValidationException(formattedErrors);
      }

      req.body = dto;
      next();
    };
  }
}

// Usage in routes
router.post(
  '/register',
  ValidationMiddleware.validate(RegisterDto),
  AuthController.register
);
```

---

## API Response Standards

```typescript
// src/shared/types/ApiResponse.ts
export class ApiResponse<T = any> {
  constructor(
    public success: boolean,
    public data?: T,
    public message?: string,
    public errors?: any[]
  ) {}

  static success<T>(data: T, message?: string): ApiResponse<T> {
    return new ApiResponse(true, data, message);
  }

  static error(message: string, errors?: any[]): ApiResponse {
    return new ApiResponse(false, undefined, message, errors);
  }
}

// src/presentation/transformers/UserTransformer.ts
export class UserTransformer {
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      createdAt: user.createdAt.toISOString()
    };
  }

  static toListResponse(users: User[]): UserResponse[] {
    return users.map(user => this.toResponse(user));
  }
}

// Usage in controller
export class AuthController {
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    const user = req.user!;
    const response = UserTransformer.toResponse(user);
    res.json(ApiResponse.success(response));
  }
}
```

---

## Caching Strategy

```typescript
// src/infrastructure/cache/ICache.ts
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set(key: string, value: any, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

// src/infrastructure/cache/RedisCache.ts
export class RedisCache implements ICache {
  constructor(private client: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set(key: string, value: any, ttl = 3600): Promise<void> {
    await this.client.setex(key, ttl, JSON.stringify(value));
  }
}

// src/application/decorators/Cacheable.ts
export function Cacheable(ttl: number = 3600) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cache: ICache = container.get(TYPES.ICache);
      const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      const cached = await cache.get(cacheKey);
      if (cached) return cached;

      const result = await originalMethod.apply(this, args);
      await cache.set(cacheKey, result, ttl);

      return result;
    };
  };
}

// Usage
export class PropertyService {
  @Cacheable(300) // Cache for 5 minutes
  async getProperty(id: string): Promise<Property> {
    return await this.propertyRepo.findById(id);
  }
}
```

---

## Testing Strategy

### Unit Tests (Example)

```typescript
// tests/unit/application/services/TenantService.test.ts
describe('TenantService', () => {
  let service: TenantService;
  let mockTenantRepo: jest.Mocked<ITenantRepository>;
  let mockUnitRepo: jest.Mocked<IUnitRepository>;
  let mockUnitOfWork: jest.Mocked<IUnitOfWork>;

  beforeEach(() => {
    mockTenantRepo = {
      save: jest.fn(),
      findById: jest.fn()
    } as any;

    mockUnitRepo = {
      updateStatus: jest.fn()
    } as any;

    mockUnitOfWork = {
      tenants: mockTenantRepo,
      units: mockUnitRepo,
      begin: jest.fn(),
      commit: jest.fn(),
      rollback: jest.fn()
    } as any;

    service = new TenantService(mockUnitOfWork);
  });

  describe('addTenant', () => {
    it('should create tenant and update unit status', async () => {
      const dto: AddTenantDto = {
        userId: 'user123',
        propertyId: 'prop123',
        unitId: 'unit123',
        leaseStart: new Date(),
        leaseEnd: new Date(),
        rent: 1000,
        deposit: 2000
      };

      const tenant = Tenant.create(dto);
      mockTenantRepo.save.mockResolvedValue(tenant);

      await service.addTenant(dto);

      expect(mockUnitOfWork.begin).toHaveBeenCalled();
      expect(mockTenantRepo.save).toHaveBeenCalled();
      expect(mockUnitRepo.updateStatus).toHaveBeenCalledWith('unit123', 'occupied');
      expect(mockUnitOfWork.commit).toHaveBeenCalled();
    });

    it('should rollback on error', async () => {
      const dto: AddTenantDto = { /* ... */ };
      mockTenantRepo.save.mockRejectedValue(new Error('DB Error'));

      await expect(service.addTenant(dto)).rejects.toThrow();
      expect(mockUnitOfWork.rollback).toHaveBeenCalled();
    });
  });
});
```

---

## Performance Optimization

### 1. Database Indexing

```typescript
// src/infrastructure/database/mongoose/schemas/UserSchema.ts
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ['owner', 'tenant', 'admin'] },
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Indexes
userSchema.index({ email: 1 }); // Single field
userSchema.index({ role: 1, isVerified: 1 }); // Compound index
userSchema.index({ createdAt: -1 }); // For sorting

// Text search
userSchema.index({ name: 'text', email: 'text' });
```

### 2. Query Optimization

```typescript
// src/infrastructure/repositories/MongoPropertyRepository.ts
export class MongoPropertyRepository implements IPropertyRepository {
  async findByOwner(
    ownerId: string,
    options: QueryOptions
  ): Promise<PaginatedResult<Property>> {
    const query = this.propertyModel
      .find({ ownerId })
      .lean() // Returns plain JS objects, not Mongoose documents
      .select('-__v') // Exclude version key
      .limit(options.limit)
      .skip(options.skip);

    // Only populate if needed
    if (options.includeUnits) {
      query.populate('units');
    }

    const [properties, total] = await Promise.all([
      query.exec(),
      this.propertyModel.countDocuments({ ownerId })
    ]);

    return {
      data: properties.map(PropertyMapper.toDomain),
      total,
      page: options.page,
      limit: options.limit
    };
  }
}
```

### 3. Batch Operations

```typescript
// src/application/services/PaymentService.ts
export class PaymentService {
  async generateMonthlyPayments(month: number, year: number): Promise<void> {
    const tenants = await this.tenantRepo.findActive();

    // Batch create instead of individual creates
    const payments = tenants.map(tenant => ({
      tenantId: tenant.id,
      amount: tenant.monthlyRent,
      dueDate: new Date(year, month, 1),
      month,
      year,
      status: 'pending'
    }));

    await this.paymentRepo.bulkCreate(payments);
  }
}
```

---

## Scalability Enhancements

### 1. Message Queue for Async Tasks

```typescript
// src/infrastructure/queue/IQueue.ts
export interface IQueue {
  publish(queue: string, message: any): Promise<void>;
  subscribe(queue: string, handler: (message: any) => Promise<void>): void;
}

// src/infrastructure/queue/RabbitMQQueue.ts
export class RabbitMQQueue implements IQueue {
  constructor(private connection: Connection) {}

  async publish(queue: string, message: any): Promise<void> {
    const channel = await this.connection.createChannel();
    await channel.assertQueue(queue);
    channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
  }
}

// Usage: Send emails asynchronously
export class TenantService {
  constructor(
    private queue: IQueue,
    private tenantRepo: ITenantRepository
  ) {}

  async addTenant(dto: AddTenantDto): Promise<Tenant> {
    const tenant = await this.tenantRepo.save(/* ... */);

    // Don't wait for email to be sent
    await this.queue.publish('emails', {
      type: 'welcome',
      to: tenant.email,
      data: { tenantName: tenant.name }
    });

    return tenant;
  }
}
```

### 2. Horizontal Scaling with Stateless Services

```typescript
// src/infrastructure/session/ISessionStore.ts
export interface ISessionStore {
  set(sessionId: string, data: any, ttl: number): Promise<void>;
  get(sessionId: string): Promise<any>;
  destroy(sessionId: string): Promise<void>;
}

// Use Redis for shared session storage across multiple instances
export class RedisSessionStore implements ISessionStore {
  // Implementation
}
```

### 3. Read Replicas for Read-Heavy Operations

```typescript
// src/infrastructure/database/DatabaseConnectionManager.ts
export class DatabaseConnectionManager {
  private writeConnection: Connection;
  private readConnections: Connection[];

  getWriteConnection(): Connection {
    return this.writeConnection;
  }

  getReadConnection(): Connection {
    // Load balance across read replicas
    const index = Math.floor(Math.random() * this.readConnections.length);
    return this.readConnections[index];
  }
}
```

---

## API Documentation with OpenAPI/Swagger

```typescript
// src/presentation/swagger/swagger.config.ts
import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Management System API',
      version: '1.0.0',
      description: 'REST API for Property Management System'
    },
    servers: [
      { url: 'http://localhost:5000/api', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/presentation/controllers/*.ts']
};

export const swaggerSpec = swaggerJsdoc(options);

// In controller:
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterDto'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Invalid input
 */
```

---

## Migration Path

### Phase 1: Foundation (Week 1-2)
1. Fix port mismatch issue
2. Set up directory structure
3. Create domain entities and interfaces
4. Implement basic repositories

### Phase 2: Application Layer (Week 3-4)
1. Create DTOs and validators
2. Implement services layer
3. Add dependency injection
4. Implement Unit of Work

### Phase 3: Refactor Controllers (Week 5)
1. Convert to class-based controllers
2. Remove business logic from controllers
3. Add proper error handling
4. Implement transformers

### Phase 4: Infrastructure (Week 6-7)
1. Add caching layer
2. Implement message queue
3. Add logging
4. Performance optimization

### Phase 5: Testing & Documentation (Week 8)
1. Write unit tests
2. Write integration tests
3. Add API documentation
4. Performance testing

---

## Key Takeaways

1. **Separation of Concerns**: Business logic in services, data access in repositories, HTTP in controllers
2. **Testability**: Dependency injection enables easy mocking
3. **Maintainability**: Each class has single responsibility
4. **Scalability**: Stateless services, message queues, caching
5. **Flexibility**: Easy to swap implementations (MongoDB → PostgreSQL)
6. **Code Quality**: Type safety, validation, error handling

---

## Additional Resources

- [Clean Architecture by Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [SOLID Principles](https://www.digitalocean.com/community/conceptual-articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)
- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)

---

## Conclusion

This refactoring will transform your codebase from a procedural, tightly-coupled application into a well-architected, scalable, and maintainable system following industry best practices and SOLID principles.

The investment in proper architecture will pay dividends in:
- Faster feature development
- Easier bug fixes
- Better testability
- Team scalability
- System reliability
