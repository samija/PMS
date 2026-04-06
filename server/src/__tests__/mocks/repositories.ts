/**
 * Mock Repositories for Unit Testing
 *
 * This file provides mock implementations of Mongoose models and other dependencies
 * used by the services. Each mock can be customized per test using jest.spyOn().
 */

import { Types } from 'mongoose';

// ==================== Helper Functions ====================

/**
 * Creates a mock ObjectId string
 */
export const createMockObjectId = (): string => {
  return new Types.ObjectId().toString();
};

/**
 * Creates a mock document with common Mongoose document properties
 */
export const createMockDocument = <T>(data: Partial<T>): any => {
  return {
    ...data,
    save: jest.fn().mockResolvedValue(data),
    toObject: jest.fn().mockReturnValue(data),
    toJSON: jest.fn().mockReturnValue(data),
  };
};

// ==================== Mock User Model ====================

export interface MockUserData {
  _id: Types.ObjectId;
  email: string;
  password?: string;
  name: string;
  phone?: string;
  role: string;
  authProvider: string;
  googleId?: string;
  isVerified: boolean;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
  comparePassword: jest.Mock;
}

export const createMockUser = (overrides: Partial<MockUserData> = {}): MockUserData => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    email: 'test@example.com',
    password: 'hashedPassword123',
    name: 'Test User',
    phone: '+1234567890',
    role: 'owner',
    authProvider: 'local',
    isVerified: true,
    avatar: undefined,
    createdAt: now,
    updatedAt: now,
    comparePassword: jest.fn().mockResolvedValue(true),
    ...overrides,
  };
};

export const createMockUserModel = () => {
  const mockUserModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    create: jest.fn(),
    deleteOne: jest.fn(),
  };
  return mockUserModel;
};

// ==================== Mock Property Model ====================

export interface MockPropertyData {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  type: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  totalFloors: number;
  totalUnits: number;
  amenities: string[];
  images: string[];
  description?: string;
  isListed: boolean;
  listingStatus: string;
  waitingListType: string;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockProperty = (overrides: Partial<MockPropertyData> = {}): MockPropertyData => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    ownerId: new Types.ObjectId(),
    name: 'Test Property',
    type: 'apartment',
    address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      country: 'Test Country',
    },
    totalFloors: 5,
    totalUnits: 20,
    amenities: ['parking', 'gym'],
    images: [],
    description: 'A test property',
    isListed: true,
    listingStatus: 'available',
    waitingListType: 'both',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockPropertyModel = () => {
  const mockPropertyModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findOneAndUpdate: jest.fn(),
    findOneAndDelete: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };
  return mockPropertyModel;
};

// ==================== Mock Unit Model ====================

export interface MockUnitData {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitNumber: string;
  floor: number;
  type: string;
  size: number;
  pricing: {
    basePrice: number;
    floorMultiplier: number;
    amenityCharges: number;
    totalPrice: number;
  };
  status: string;
  features: string[];
  images: string[];
  currentTenantId?: Types.ObjectId;
  leaseStart?: Date;
  leaseEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockUnit = (overrides: Partial<MockUnitData> = {}): MockUnitData => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    propertyId: new Types.ObjectId(),
    unitNumber: 'A101',
    floor: 1,
    type: '2bed',
    size: 80,
    pricing: {
      basePrice: 15000,
      floorMultiplier: 1.02,
      amenityCharges: 500,
      totalPrice: 15800,
    },
    status: 'vacant',
    features: ['balcony', 'parking'],
    images: [],
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockUnitModel = () => {
  const mockUnitModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    findOneAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  };
  return mockUnitModel;
};

// ==================== Mock Tenant Model ====================

export interface MockTenantData {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  propertyId: Types.ObjectId;
  unitId: Types.ObjectId;
  ownerId: Types.ObjectId;
  leaseAgreement: {
    startDate: Date;
    endDate: Date;
    monthlyRent: number;
    deposit: number;
    terms?: string;
  };
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  documents: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
}

export const createMockTenant = (overrides: Partial<MockTenantData> = {}): MockTenantData => {
  const now = new Date();
  const startDate = now;
  const endDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

  const tenant: MockTenantData = {
    _id: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    propertyId: new Types.ObjectId(),
    unitId: new Types.ObjectId(),
    ownerId: new Types.ObjectId(),
    leaseAgreement: {
      startDate,
      endDate,
      monthlyRent: 15000,
      deposit: 30000,
      terms: 'Standard lease terms',
    },
    emergencyContact: {
      name: 'Emergency Contact',
      phone: '+1234567890',
      relationship: 'Spouse',
    },
    documents: [],
    status: 'active',
    createdAt: now,
    updatedAt: now,
    save: jest.fn(),
    ...overrides,
  };

  tenant.save.mockResolvedValue(tenant);
  return tenant;
};

export const createMockTenantModel = () => {
  const mockTenantModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    populate: jest.fn(),
  };
  return mockTenantModel;
};

// ==================== Mock Payment Model ====================

export interface MockPaymentData {
  _id: Types.ObjectId;
  tenantId: Types.ObjectId;
  unitId: Types.ObjectId;
  propertyId: Types.ObjectId;
  ownerId: Types.ObjectId;
  amount: number;
  type: string;
  status: string;
  paymentMethod: string;
  gatewayReference?: string;
  gatewayTransactionRef?: string;
  gatewayMetadata?: Record<string, any>;
  chapaReference?: string;
  chapaTxRef?: string;
  dueDate: Date;
  paidAt?: Date;
  month: number;
  year: number;
  receipt?: {
    number: string;
    generatedAt: Date;
  };
  bankTransferReceipt?: string;
  bankTransferApprovalStatus?: string;
  bankTransferApprovalNotes?: string;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  save: jest.Mock;
}

export const createMockPayment = (overrides: Partial<MockPaymentData> = {}): MockPaymentData => {
  const now = new Date();

  const payment: MockPaymentData = {
    _id: new Types.ObjectId(),
    tenantId: new Types.ObjectId(),
    unitId: new Types.ObjectId(),
    propertyId: new Types.ObjectId(),
    ownerId: new Types.ObjectId(),
    amount: 15000,
    type: 'rent',
    status: 'pending',
    paymentMethod: 'chapa',
    dueDate: now,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    createdAt: now,
    updatedAt: now,
    save: jest.fn(),
    ...overrides,
  };

  payment.save.mockResolvedValue(payment);
  return payment;
};

export const createMockPaymentModel = () => {
  const mockPaymentModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn(),
    aggregate: jest.fn(),
  };
  return mockPaymentModel;
};

// ==================== Mock Property Staff Model ====================

export interface MockPropertyStaffData {
  _id: Types.ObjectId;
  propertyId: Types.ObjectId;
  userId: Types.ObjectId;
  role: string;
  assignedBy: Types.ObjectId;
  permissions: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const createMockPropertyStaff = (overrides: Partial<MockPropertyStaffData> = {}): MockPropertyStaffData => {
  const now = new Date();
  return {
    _id: new Types.ObjectId(),
    propertyId: new Types.ObjectId(),
    userId: new Types.ObjectId(),
    role: 'manager',
    assignedBy: new Types.ObjectId(),
    permissions: ['view', 'edit'],
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
};

export const createMockPropertyStaffModel = () => {
  const mockPropertyStaffModel = {
    findOne: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
  };
  return mockPropertyStaffModel;
};

// ==================== Mock Payment Gateway ====================

export const createMockPaymentGateway = () => {
  return {
    getType: jest.fn().mockReturnValue('chapa'),
    initializePayment: jest.fn().mockResolvedValue({
      success: true,
      checkoutUrl: 'https://checkout.chapa.co/test-checkout',
      transactionRef: 'PMS-test-tx-ref',
      gatewayReference: 'chapa-ref-123',
    }),
    verifyPayment: jest.fn().mockResolvedValue({
      success: true,
      status: 'success',
      transactionRef: 'PMS-test-tx-ref',
      gatewayReference: 'chapa-ref-123',
      amount: 15000,
      currency: 'ETB',
      paidAt: new Date(),
    }),
    verifyWebhookSignature: jest.fn().mockResolvedValue(true),
    parseWebhookData: jest.fn().mockReturnValue({
      transactionRef: 'PMS-test-tx-ref',
      status: 'success',
      gatewayReference: 'chapa-ref-123',
      amount: 15000,
    }),
    generateTransactionRef: jest.fn().mockReturnValue('PMS-test-tx-ref-' + Date.now()),
  };
};

// ==================== Chainable Query Mock ====================

/**
 * Creates a chainable query mock for Mongoose queries with populate, sort, skip, limit, lean
 */
export const createChainableQuery = <T>(result: T) => {
  const chainable: any = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockResolvedValue(result),
    select: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chainable;
};

/**
 * Creates a chainable query that returns non-lean result (for documents that need save())
 */
export const createChainableDocumentQuery = <T>(result: T) => {
  const chainable: any = {
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    select: jest.fn().mockResolvedValue(result),
    exec: jest.fn().mockResolvedValue(result),
  };
  return chainable;
};
