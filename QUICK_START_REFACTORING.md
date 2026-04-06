# Quick Start: Refactoring Guide

This guide will help you start refactoring your PMS application in small, manageable steps.

## Step 1: Install Required Dependencies

```bash
cd server

# Validation
npm install class-validator class-transformer reflect-metadata

# Dependency Injection (optional for now)
npm install inversify

# Types
npm install --save-dev @types/node
```

## Step 2: Create Basic Directory Structure

```bash
cd src
mkdir -p domain/{entities,interfaces,exceptions}
mkdir -p application/{services,dto}
mkdir -p infrastructure/repositories
mkdir -p presentation/{transformers,validators}
```

## Step 3: Create Your First Service Layer

### 3.1 Create AuthService

Create `src/application/services/AuthService.ts`:

```typescript
import { Model } from 'mongoose';
import { IUser } from '../../types/index.js';
import { generateToken } from '../../middleware/auth.js';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
  };
  token: string;
}

export class AuthService {
  constructor(private userModel: Model<IUser>) {}

  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Create user
    const user = await this.userModel.create({
      email: data.email,
      password: data.password,
      name: data.name,
      phone: data.phone,
      role: data.role || 'owner',
      authProvider: 'local',
    });

    // Generate token
    const token = generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }

  async login(data: LoginData): Promise<AuthResponse> {
    // Find user with password
    const user = await this.userModel.findOne({ email: data.email }).select('+password');

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check OAuth users
    if (user.authProvider === 'google' && !user.password) {
      throw new Error('Please login with Google');
    }

    // Verify password
    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user);

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
      },
      token,
    };
  }
}
```

### 3.2 Update AuthController to Use Service

Update `src/controllers/authController.ts`:

```typescript
import { Request, Response } from 'express';
import User from '../models/User.js';
import { AuthService } from '../application/services/AuthService.js';
import { AuthRequest } from '../types/index.js';

// Create service instance
const authService = new AuthService(User);

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, phone, role } = req.body;

    const result = await authService.register({
      email,
      password,
      name,
      phone,
      role,
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(error.message.includes('already registered') ? 400 : 500).json({
      success: false,
      message: error.message || 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    const result = await authService.login({ email, password });

    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(error.message.includes('Invalid') ? 401 : 500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

// Keep other exports as they were
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  // ... existing code
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  // ... existing code
};

export const googleCallback = async (req: AuthRequest, res: Response): Promise<void> => {
  // ... existing code
};
```

## Step 4: Create Custom Error Classes

Create `src/domain/exceptions/AppError.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(404, `${resource} not found`, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}
```

### 4.1 Update Error Handler

Update `src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../domain/exceptions/AppError.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
    });
    return;
  }

  // Unknown error
  res.status(500).json({
    success: false,
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export class ApiError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default { errorHandler, ApiError, asyncHandler };
```

### 4.2 Update AuthService to Use Custom Errors

Update `src/application/services/AuthService.ts`:

```typescript
import { ConflictError, UnauthorizedError } from '../../domain/exceptions/AppError.js';

export class AuthService {
  // ... constructor

  async register(data: RegisterData): Promise<AuthResponse> {
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }

    // ... rest of the code
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const user = await this.userModel.findOne({ email: data.email }).select('+password');

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.authProvider === 'google' && !user.password) {
      throw new UnauthorizedError('Please login with Google');
    }

    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // ... rest of the code
  }
}
```

### 4.3 Simplify Controller

Update `src/controllers/authController.ts`:

```typescript
export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    next(error); // Pass to error handler middleware
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
```

## Step 5: Add Input Validation

### 5.1 Create DTOs

Create `src/application/dto/RegisterDto.ts`:

```typescript
import { IsEmail, IsString, MinLength, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain uppercase, lowercase, and number'
  })
  password!: string;

  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name!: string;

  @IsOptional()
  @Matches(/^\+?[1-9]\d{1,14}$/, { message: 'Invalid phone number' })
  phone?: string;

  @IsOptional()
  @IsString()
  role?: string;
}
```

Create `src/application/dto/LoginDto.ts`:

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email address' })
  email!: string;

  @IsString()
  @MinLength(1, { message: 'Password is required' })
  password!: string;
}
```

### 5.2 Create Validation Middleware

Create `src/presentation/validators/ValidationMiddleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { plainToClass } from 'class-transformer';
import { validate, ValidationError as ClassValidationError } from 'class-validator';
import { ValidationError } from '../../domain/exceptions/AppError.js';

type ClassConstructor<T> = new (...args: any[]) => T;

export class ValidationMiddleware {
  static validate<T extends object>(dtoClass: ClassConstructor<T>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const dto = plainToClass(dtoClass, req.body);
        const errors = await validate(dto);

        if (errors.length > 0) {
          const formattedErrors = errors.map((error: ClassValidationError) => ({
            field: error.property,
            constraints: error.constraints,
          }));

          throw new ValidationError(
            `Validation failed: ${formattedErrors
              .map(e => Object.values(e.constraints || {}).join(', '))
              .join('; ')}`
          );
        }

        req.body = dto;
        next();
      } catch (error) {
        next(error);
      }
    };
  }
}
```

### 5.3 Update Routes to Use Validation

Update `src/routes/authRoutes.ts`:

```typescript
import { Router } from 'express';
import {
  register,
  login,
  getProfile,
  updateProfile,
  googleCallback,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationMiddleware } from '../presentation/validators/ValidationMiddleware.js';
import { RegisterDto } from '../application/dto/RegisterDto.js';
import { LoginDto } from '../application/dto/LoginDto.js';

const router = Router();

// Add validation middleware
router.post('/register', ValidationMiddleware.validate(RegisterDto), register);
router.post('/login', ValidationMiddleware.validate(LoginDto), login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false }), googleCallback);

export default router;
```

### 5.4 Update index.ts

Make sure to import reflect-metadata at the very top of `src/index.ts`:

```typescript
import 'reflect-metadata'; // Must be first
import express from 'express';
import cors from 'cors';
// ... rest of imports
```

## Step 6: Test Your Changes

1. Start the server:
```bash
cd server
npm run dev
```

2. Test registration with invalid data:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "weak",
    "name": "J"
  }'
```

Expected response:
```json
{
  "success": false,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed: Invalid email address; Password must be at least 8 characters; ..."
}
```

3. Test registration with valid data:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123",
    "name": "John Doe",
    "phone": "+251911234567"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "...",
      "email": "test@example.com",
      "name": "John Doe",
      "role": "owner"
    },
    "token": "..."
  }
}
```

## Next Steps

Once you've successfully implemented the above:

1. **Create TenantService** following the same pattern as AuthService
2. **Create PropertyService** for property management
3. **Add Repository Pattern** to abstract database access
4. **Add Unit Tests** for your services
5. **Convert Controllers to Classes** using dependency injection

## Common Issues

### Issue 1: "Cannot find module 'reflect-metadata'"
**Solution**: Install it and import at the top of index.ts
```bash
npm install reflect-metadata
```

### Issue 2: Validation not working
**Solution**: Make sure reflect-metadata is imported before any decorators are used

### Issue 3: Class-validator decorators not recognized
**Solution**: Update tsconfig.json:
```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

### Issue 4: Import paths breaking
**Solution**: Keep the .js extensions in imports for ES modules

## Verification Checklist

- [ ] Port mismatch fixed (client uses 5000)
- [ ] AuthService created and working
- [ ] Custom error classes implemented
- [ ] Error handler middleware updated
- [ ] DTOs created with validation decorators
- [ ] Validation middleware working
- [ ] All auth endpoints still work
- [ ] Error responses are consistent
- [ ] Validation errors are user-friendly

## Summary

You've now:
1. ✅ Fixed the port mismatch
2. ✅ Created your first service layer
3. ✅ Implemented custom error handling
4. ✅ Added input validation with DTOs
5. ✅ Improved code organization

Your controller is now cleaner, business logic is separated, and you have proper error handling and validation!

Next, apply the same pattern to other controllers (tenants, properties, payments).
