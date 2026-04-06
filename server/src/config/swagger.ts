// @ts-ignore - Module import compatibility
import swaggerJsdoc from 'swagger-jsdoc';
// @ts-ignore - Module import compatibility
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Property Management System API',
      version: '1.0.0',
      description: `
## Overview
The Property Management System (PMS) API provides comprehensive endpoints for managing properties, tenants, payments, maintenance requests, and more.

## Authentication
Most endpoints require authentication using JWT Bearer tokens. Include the token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## User Roles
- **owner**: Property owners who can manage their properties, tenants, and payments
- **tenant**: Tenants who can view their tenancy details, make payments, and submit maintenance requests
- **admin**: System administrators with full access
- **technician**: Maintenance technicians who can update maintenance request status
- **manager**: Property managers with delegated access
- **marketing**: Marketing staff with limited property access

## Response Format
All API responses follow a standard format:
\`\`\`json
{
  "success": true|false,
  "message": "Optional message",
  "data": { ... }
}
\`\`\`
      `,
      contact: {
        name: 'PMS Support',
        email: 'support@pms.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Development server',
      },
      {
        url: 'https://api.pms.com/api',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token',
        },
      },
      schemas: {
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            pages: { type: 'integer', example: 10 },
          },
        },
        // Auth Schemas
        RegisterDto: {
          type: 'object',
          required: ['email', 'password', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: {
              type: 'string',
              minLength: 8,
              example: 'Password123',
              description: 'Must contain uppercase, lowercase, and number',
            },
            name: { type: 'string', minLength: 2, example: 'John Doe' },
            phone: { type: 'string', example: '+251911234567' },
            role: { type: 'string', enum: ['owner', 'tenant'], default: 'owner' },
          },
        },
        LoginDto: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'user@example.com' },
            password: { type: 'string', example: 'Password123' },
          },
        },
        UpdateProfileDto: {
          type: 'object',
          properties: {
            name: { type: 'string', minLength: 2, example: 'John Doe' },
            phone: { type: 'string', example: '+251911234567' },
          },
        },
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            role: { type: 'string', enum: ['owner', 'tenant', 'admin', 'technician', 'marketing', 'manager'] },
            isVerified: { type: 'boolean' },
            avatar: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AuthResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                token: { type: 'string' },
                user: { $ref: '#/components/schemas/User' },
              },
            },
          },
        },
        // Property Schemas
        Address: {
          type: 'object',
          required: ['street', 'city', 'state', 'country'],
          properties: {
            street: { type: 'string', example: 'Bole Road' },
            city: { type: 'string', example: 'Addis Ababa' },
            state: { type: 'string', example: 'Addis Ababa' },
            country: { type: 'string', example: 'Ethiopia' },
            postalCode: { type: 'string', example: '1000' },
            coordinates: {
              type: 'object',
              properties: {
                lat: { type: 'number', example: 9.0054 },
                lng: { type: 'number', example: 38.7636 },
              },
            },
          },
        },
        Property: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ownerId: { type: 'string' },
            name: { type: 'string', example: 'Sunshine Apartments' },
            type: { type: 'string', enum: ['apartment', 'house', 'commercial', 'villa'] },
            address: { $ref: '#/components/schemas/Address' },
            totalFloors: { type: 'integer', example: 5 },
            totalUnits: { type: 'integer', example: 20 },
            amenities: { type: 'array', items: { type: 'string' }, example: ['parking', 'gym', 'pool'] },
            images: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            isListed: { type: 'boolean', default: false },
            listingStatus: { type: 'string', enum: ['available', 'occupied', 'maintenance'] },
            waitingListType: { type: 'string', enum: ['queue', 'application', 'both'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreatePropertyDto: {
          type: 'object',
          required: ['name', 'type', 'address', 'totalFloors', 'totalUnits'],
          properties: {
            name: { type: 'string', example: 'Sunshine Apartments' },
            type: { type: 'string', enum: ['apartment', 'house', 'commercial', 'villa'] },
            address: { $ref: '#/components/schemas/Address' },
            totalFloors: { type: 'integer', minimum: 1, example: 5 },
            totalUnits: { type: 'integer', minimum: 1, example: 20 },
            amenities: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
          },
        },
        // Unit Schemas
        Pricing: {
          type: 'object',
          properties: {
            basePrice: { type: 'number', example: 15000 },
            floorMultiplier: { type: 'number', example: 1.05 },
            amenityCharges: { type: 'number', example: 500 },
            totalPrice: { type: 'number', example: 16250 },
          },
        },
        Unit: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            propertyId: { type: 'string' },
            unitNumber: { type: 'string', example: 'A101' },
            floor: { type: 'integer', example: 1 },
            type: { type: 'string', enum: ['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse'] },
            size: { type: 'number', description: 'Size in square meters', example: 75 },
            pricing: { $ref: '#/components/schemas/Pricing' },
            status: { type: 'string', enum: ['vacant', 'occupied', 'reserved', 'maintenance'] },
            features: { type: 'array', items: { type: 'string' } },
            images: { type: 'array', items: { type: 'string' } },
            currentTenantId: { type: 'string' },
            leaseStart: { type: 'string', format: 'date-time' },
            leaseEnd: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateUnitDto: {
          type: 'object',
          required: ['unitNumber', 'floor', 'type', 'size', 'pricing'],
          properties: {
            unitNumber: { type: 'string', example: 'A101' },
            floor: { type: 'integer', minimum: 0, example: 1 },
            type: { type: 'string', enum: ['studio', '1bed', '2bed', '3bed', 'office', 'shop', 'warehouse'] },
            size: { type: 'number', example: 75 },
            pricing: {
              type: 'object',
              properties: {
                basePrice: { type: 'number', example: 15000 },
                amenityCharges: { type: 'number', example: 500 },
              },
            },
            features: { type: 'array', items: { type: 'string' } },
          },
        },
        // Tenant Schemas
        LeaseAgreement: {
          type: 'object',
          properties: {
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
            monthlyRent: { type: 'number', example: 15000 },
            deposit: { type: 'number', example: 30000 },
            terms: { type: 'string' },
          },
        },
        EmergencyContact: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            phone: { type: 'string' },
            relationship: { type: 'string' },
          },
        },
        Tenant: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            userId: { $ref: '#/components/schemas/User' },
            propertyId: { type: 'string' },
            unitId: { type: 'string' },
            ownerId: { type: 'string' },
            leaseAgreement: { $ref: '#/components/schemas/LeaseAgreement' },
            emergencyContact: { $ref: '#/components/schemas/EmergencyContact' },
            documents: { type: 'array', items: { type: 'string' } },
            status: { type: 'string', enum: ['active', 'pending', 'terminated'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTenantDto: {
          type: 'object',
          required: ['email', 'name', 'propertyId', 'unitId', 'leaseAgreement'],
          properties: {
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            phone: { type: 'string' },
            propertyId: { type: 'string' },
            unitId: { type: 'string' },
            leaseAgreement: {
              type: 'object',
              required: ['startDate', 'endDate', 'monthlyRent', 'deposit'],
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                monthlyRent: { type: 'number', minimum: 0 },
                deposit: { type: 'number', minimum: 0 },
                terms: { type: 'string' },
              },
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' },
              },
            },
          },
        },
        UpdateTenantDto: {
          type: 'object',
          properties: {
            leaseAgreement: {
              type: 'object',
              properties: {
                startDate: { type: 'string', format: 'date' },
                endDate: { type: 'string', format: 'date' },
                monthlyRent: { type: 'number' },
                deposit: { type: 'number' },
                terms: { type: 'string' },
              },
            },
            emergencyContact: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phone: { type: 'string' },
                relationship: { type: 'string' },
              },
            },
            status: { type: 'string', enum: ['active', 'pending', 'terminated'] },
          },
        },
        // Payment Schemas
        Payment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tenantId: { type: 'string' },
            unitId: { type: 'string' },
            propertyId: { type: 'string' },
            ownerId: { type: 'string' },
            amount: { type: 'number', example: 15000 },
            type: { type: 'string', enum: ['rent', 'deposit', 'maintenance', 'utility', 'penalty'] },
            status: { type: 'string', enum: ['pending', 'completed', 'failed', 'refunded'] },
            paymentMethod: { type: 'string', enum: ['chapa', 'telebirr', 'santimpay', 'manual', 'bank_transfer'] },
            gatewayReference: { type: 'string' },
            gatewayTransactionRef: { type: 'string' },
            dueDate: { type: 'string', format: 'date-time' },
            paidAt: { type: 'string', format: 'date-time' },
            month: { type: 'integer', minimum: 1, maximum: 12 },
            year: { type: 'integer' },
            receipt: {
              type: 'object',
              properties: {
                number: { type: 'string' },
                generatedAt: { type: 'string', format: 'date-time' },
                url: { type: 'string' },
              },
            },
            bankTransferReceipt: { type: 'string' },
            bankTransferApprovalStatus: { type: 'string', enum: ['pending_approval', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        InitializePaymentDto: {
          type: 'object',
          required: ['tenantId', 'amount', 'type', 'month', 'year'],
          properties: {
            tenantId: { type: 'string' },
            amount: { type: 'number', minimum: 1 },
            type: { type: 'string', enum: ['rent', 'deposit', 'maintenance', 'utility', 'penalty'] },
            month: { type: 'integer', minimum: 1, maximum: 12 },
            year: { type: 'integer', minimum: 2020 },
            dueDate: { type: 'string', format: 'date' },
            gateway: { type: 'string', enum: ['chapa', 'telebirr', 'santimpay'] },
          },
        },
        CreateManualPaymentDto: {
          type: 'object',
          required: ['tenantId', 'amount', 'type', 'month', 'year'],
          properties: {
            tenantId: { type: 'string' },
            amount: { type: 'number', minimum: 1 },
            type: { type: 'string', enum: ['rent', 'deposit', 'maintenance', 'utility', 'penalty'] },
            month: { type: 'integer', minimum: 1, maximum: 12 },
            year: { type: 'integer', minimum: 2020 },
            dueDate: { type: 'string', format: 'date' },
            notes: { type: 'string' },
          },
        },
        ApprovePaymentDto: {
          type: 'object',
          properties: {
            notes: { type: 'string', maxLength: 500 },
          },
        },
        // Maintenance Schemas
        Maintenance: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tenantId: { type: 'string' },
            propertyId: { type: 'string' },
            unitId: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            category: { type: 'string', enum: ['plumbing', 'electrical', 'appliance', 'structural', 'hvac', 'other'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
            status: { type: 'string', enum: ['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled'] },
            images: { type: 'array', items: { type: 'string' } },
            assignedTechnician: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date-time' },
            estimatedCost: { type: 'number' },
            actualCost: { type: 'number' },
            completedAt: { type: 'string', format: 'date-time' },
            feedback: {
              type: 'object',
              properties: {
                rating: { type: 'integer', minimum: 1, maximum: 5 },
                comment: { type: 'string' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateMaintenanceRequestDto: {
          type: 'object',
          required: ['title', 'description', 'category'],
          properties: {
            title: { type: 'string', minLength: 3 },
            description: { type: 'string', minLength: 10 },
            category: { type: 'string', enum: ['plumbing', 'electrical', 'appliance', 'structural', 'hvac', 'other'] },
            priority: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'], default: 'medium' },
            images: { type: 'array', items: { type: 'string' } },
          },
        },
        UpdateMaintenanceStatusDto: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['submitted', 'acknowledged', 'assigned', 'in_progress', 'completed', 'cancelled'] },
            note: { type: 'string' },
          },
        },
        AssignTechnicianDto: {
          type: 'object',
          required: ['technicianId'],
          properties: {
            technicianId: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date' },
            estimatedCost: { type: 'number', minimum: 0 },
            note: { type: 'string' },
          },
        },
        CompleteMaintenanceDto: {
          type: 'object',
          properties: {
            actualCost: { type: 'number', minimum: 0 },
            completionImages: { type: 'array', items: { type: 'string' } },
            note: { type: 'string' },
          },
        },
        SubmitFeedbackDto: {
          type: 'object',
          required: ['rating'],
          properties: {
            rating: { type: 'integer', minimum: 1, maximum: 5 },
            feedback: { type: 'string' },
          },
        },
        // Waiting List Schemas
        WaitingListEntry: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            applicantId: { type: 'string' },
            propertyId: { type: 'string' },
            unitId: { type: 'string' },
            type: { type: 'string', enum: ['queue', 'application'] },
            status: { type: 'string', enum: ['waiting', 'offered', 'accepted', 'rejected', 'expired'] },
            position: { type: 'integer' },
            application: {
              type: 'object',
              properties: {
                employmentInfo: { type: 'string' },
                income: { type: 'number' },
                references: { type: 'array', items: { type: 'string' } },
                documents: { type: 'array', items: { type: 'string' } },
                notes: { type: 'string' },
              },
            },
            offerDetails: {
              type: 'object',
              properties: {
                unitId: { type: 'string' },
                offeredAt: { type: 'string', format: 'date-time' },
                expiresAt: { type: 'string', format: 'date-time' },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        ApplyToWaitingListDto: {
          type: 'object',
          required: ['propertyId'],
          properties: {
            propertyId: { type: 'string' },
            unitId: { type: 'string' },
            type: { type: 'string', enum: ['queue', 'application'] },
            application: {
              type: 'object',
              properties: {
                employmentInfo: { type: 'string' },
                income: { type: 'number' },
                references: { type: 'array', items: { type: 'string' } },
                documents: { type: 'array', items: { type: 'string' } },
                notes: { type: 'string' },
              },
            },
          },
        },
        OfferUnitDto: {
          type: 'object',
          required: ['unitId'],
          properties: {
            unitId: { type: 'string' },
            expiresInDays: { type: 'integer', minimum: 1, maximum: 30, default: 7 },
          },
        },
        RespondToOfferDto: {
          type: 'object',
          required: ['accept'],
          properties: {
            accept: { type: 'boolean' },
          },
        },
        UpdateWaitingListStatusDto: {
          type: 'object',
          required: ['status'],
          properties: {
            status: { type: 'string', enum: ['waiting', 'offered', 'accepted', 'rejected', 'expired'] },
            notes: { type: 'string' },
          },
        },
        // Staff Schemas
        PropertyStaff: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            propertyId: { type: 'string' },
            userId: { $ref: '#/components/schemas/User' },
            role: { type: 'string', enum: ['manager', 'marketing', 'technician'] },
            permissions: { type: 'array', items: { type: 'string' } },
            assignedBy: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        AddStaffDto: {
          type: 'object',
          required: ['userId', 'role'],
          properties: {
            userId: { type: 'string' },
            role: { type: 'string', enum: ['manager', 'marketing', 'technician'] },
            permissions: { type: 'array', items: { type: 'string' } },
          },
        },
        UpdateStaffDto: {
          type: 'object',
          properties: {
            role: { type: 'string', enum: ['manager', 'marketing', 'technician'] },
            permissions: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
          },
        },
        // Settings Schemas
        BankDetails: {
          type: 'object',
          properties: {
            bankName: {
              type: 'string',
              enum: [
                'CBE', 'Awash Bank', 'Dashen Bank', 'Bank of Abyssinia', 'Wegagen Bank',
                'United Bank', 'Nib International Bank', 'Zemen Bank',
                'Cooperative Bank of Oromia', 'Abay Bank', 'Berhan Bank', 'Bunna International Bank',
              ],
            },
            accountNumber: { type: 'string' },
            accountHolderName: { type: 'string' },
          },
        },
        PaymentSettings: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            ownerId: { type: 'string' },
            preferredPaymentMethod: { type: 'string', enum: ['chapa', 'telebirr', 'santimpay', 'bank_transfer'] },
            bankDetails: { $ref: '#/components/schemas/BankDetails' },
            paymentInstructions: { type: 'string' },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        UpdatePaymentSettingsDto: {
          type: 'object',
          properties: {
            preferredPaymentMethod: { type: 'string', enum: ['chapa', 'telebirr', 'santimpay', 'bank_transfer'] },
            bankDetails: {
              type: 'object',
              properties: {
                bankName: { type: 'string' },
                accountNumber: { type: 'string' },
                accountHolderName: { type: 'string' },
              },
            },
            paymentInstructions: { type: 'string', maxLength: 1000 },
            isActive: { type: 'boolean' },
          },
        },
        // Listing Schemas
        Listing: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string' },
            address: { $ref: '#/components/schemas/Address' },
            images: { type: 'array', items: { type: 'string' } },
            description: { type: 'string' },
            amenities: { type: 'array', items: { type: 'string' } },
            availableUnits: { type: 'integer' },
            priceRange: {
              type: 'object',
              properties: {
                minPrice: { type: 'number' },
                maxPrice: { type: 'number' },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Properties', description: 'Property management endpoints' },
      { name: 'Units', description: 'Unit management endpoints (nested under properties)' },
      { name: 'Tenants', description: 'Tenant management endpoints' },
      { name: 'Payments', description: 'Payment processing endpoints' },
      { name: 'Maintenance', description: 'Maintenance request endpoints' },
      { name: 'Waiting List', description: 'Waiting list management endpoints' },
      { name: 'Staff', description: 'Staff management endpoints' },
      { name: 'Settings', description: 'Owner settings endpoints' },
      { name: 'Listings', description: 'Public property listings endpoints' },
    ],
  },
  apis: ['./src/routes/*.ts', './dist/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app: Express): void => {
  // Swagger UI
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'PMS API Documentation',
  }));

  // Serve swagger spec as JSON
  app.get('/api/docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
};

export default swaggerSpec;
