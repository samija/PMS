/**
 * Jest Setup File
 * This file runs before each test file
 */

// Set environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key';
process.env.JWT_EXPIRES_IN = '1d';
process.env.BASE_URL = 'http://localhost:5000';
process.env.FRONTEND_URL = 'http://localhost:5173';
process.env.DEFAULT_PAYMENT_GATEWAY = 'chapa';

// Mock console methods if needed (optional - uncomment to suppress logs during tests)
// jest.spyOn(console, 'log').mockImplementation(() => {});
// jest.spyOn(console, 'error').mockImplementation(() => {});
// jest.spyOn(console, 'warn').mockImplementation(() => {});
