import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';

let mongoServer: MongoMemoryServer;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    for (const collection of collections) {
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
  });
};

export const generateTestToken = (userId: string, role = 'owner', email = 'test@example.com') => {
  return jwt.sign(
    { id: userId, email, role },
    process.env.JWT_SECRET || 'test-jwt-secret-key',
    { expiresIn: '1d' }
  );
};

export const createTestUser = async (overrides: Record<string, any> = {}) => {
  const User = (await import('../../models/User.js')).default;
  const userData = {
    email: `test${Date.now()}@example.com`,
    password: 'Password123!',
    name: 'Test User',
    role: 'owner',
    phone: '+251911000000',
    ...overrides,
  };
  const user = await User.create(userData);
  const token = generateTestToken(user._id.toString(), user.role, user.email);
  return { user, token };
};

export const createTestProperty = async (ownerId: string, overrides: Record<string, any> = {}) => {
  const Property = (await import('../../models/Property.js')).default;
  return Property.create({
    ownerId,
    name: 'Test Property',
    type: 'apartment',
    address: {
      street: 'Bole Road',
      city: 'Addis Ababa',
      state: 'Addis Ababa',
      country: 'Ethiopia',
    },
    totalFloors: 5,
    totalUnits: 20,
    amenities: ['parking', 'security'],
    images: [],
    isListed: true,
    listingStatus: 'available',
    ...overrides,
  });
};

export const createTestUnit = async (propertyId: string, overrides: Record<string, any> = {}) => {
  const Unit = (await import('../../models/Unit.js')).default;
  return Unit.create({
    property: propertyId,
    unitNumber: `U-${Date.now()}`,
    floor: 1,
    type: '2bed',
    size: 80,
    pricing: {
      basePrice: 15000,
      floorMultiplier: 1,
      amenityCharges: 0,
      totalPrice: 15000,
    },
    status: 'vacant',
    features: [],
    images: [],
    ...overrides,
  });
};

export const createTestTenant = async (
  userId: string,
  propertyId: string,
  unitId: string,
  ownerId: string,
  overrides: Record<string, any> = {}
) => {
  const Tenant = (await import('../../models/Tenant.js')).default;
  return Tenant.create({
    userId,
    propertyId,
    unitId,
    ownerId,
    leaseAgreement: {
      startDate: new Date(),
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      monthlyRent: 15000,
      deposit: 30000,
    },
    status: 'active',
    documents: [],
    ...overrides,
  });
};
