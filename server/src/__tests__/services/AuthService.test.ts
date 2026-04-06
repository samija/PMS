/**
 * AuthService Unit Tests
 *
 * Tests for the AuthService which handles user authentication and registration.
 */

import { Types } from 'mongoose';
import { AuthService } from '../../application/services/AuthService';
import {
  createMockUser,
  createMockUserModel,
  createChainableDocumentQuery,
} from '../mocks/repositories';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../domain/exceptions/AppError';

// Mock the auth middleware
jest.mock('../../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserModel: ReturnType<typeof createMockUserModel>;

  beforeEach(() => {
    mockUserModel = createMockUserModel();
    authService = new AuthService(mockUserModel as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const registerData = {
      email: 'newuser@example.com',
      password: 'securePassword123',
      name: 'New User',
      phone: '+1234567890',
    };

    it('should successfully register a new user', async () => {
      // Arrange
      const mockCreatedUser = createMockUser({
        _id: new Types.ObjectId(),
        email: registerData.email,
        name: registerData.name,
        phone: registerData.phone,
        role: 'owner',
        authProvider: 'local',
      });

      mockUserModel.findOne.mockResolvedValue(null); // No existing user
      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await authService.register(registerData);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: registerData.email });
      expect(mockUserModel.create).toHaveBeenCalledWith({
        email: registerData.email,
        password: registerData.password,
        name: registerData.name,
        phone: registerData.phone,
        role: 'owner',
        authProvider: 'local',
      });
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.user.email).toBe(registerData.email);
      expect(result.user.name).toBe(registerData.name);
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should register a user with a custom role', async () => {
      // Arrange
      const registerDataWithRole = {
        ...registerData,
        role: 'tenant',
      };

      const mockCreatedUser = createMockUser({
        email: registerDataWithRole.email,
        name: registerDataWithRole.name,
        role: 'tenant',
      });

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await authService.register(registerDataWithRole);

      // Assert
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'tenant' })
      );
      expect(result.user.role).toBe('tenant');
    });

    it('should throw ConflictError when email is already registered', async () => {
      // Arrange
      const existingUser = createMockUser({ email: registerData.email });
      mockUserModel.findOne.mockResolvedValue(existingUser);

      // Act & Assert
      await expect(authService.register(registerData)).rejects.toThrow(ConflictError);
      await expect(authService.register(registerData)).rejects.toThrow('Email already registered');
      expect(mockUserModel.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const loginData = {
      email: 'user@example.com',
      password: 'correctPassword123',
    };

    it('should successfully login with valid credentials', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: loginData.email,
        password: 'hashedPassword',
        authProvider: 'local',
      });
      mockUser.comparePassword.mockResolvedValue(true);

      const selectChain = createChainableDocumentQuery(mockUser);
      mockUserModel.findOne.mockReturnValue(selectChain);
      selectChain.select.mockResolvedValue(mockUser);

      // Act
      const result = await authService.login(loginData);

      // Assert
      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: loginData.email });
      expect(mockUser.comparePassword).toHaveBeenCalledWith(loginData.password);
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw UnauthorizedError when user does not exist', async () => {
      // Arrange
      const selectChain = createChainableDocumentQuery(null);
      mockUserModel.findOne.mockReturnValue(selectChain);
      selectChain.select.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError when password is incorrect', async () => {
      // Arrange
      const mockUser = createMockUser({
        email: loginData.email,
        password: 'hashedPassword',
        authProvider: 'local',
      });
      mockUser.comparePassword.mockResolvedValue(false);

      const selectChain = createChainableDocumentQuery(mockUser);
      mockUserModel.findOne.mockReturnValue(selectChain);
      selectChain.select.mockResolvedValue(mockUser);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginData)).rejects.toThrow('Invalid email or password');
    });

    it('should throw UnauthorizedError when Google OAuth user tries to login with password', async () => {
      // Arrange
      const mockGoogleUser = createMockUser({
        email: loginData.email,
        password: undefined,
        authProvider: 'google',
        googleId: 'google-id-123',
      });

      const selectChain = createChainableDocumentQuery(mockGoogleUser);
      mockUserModel.findOne.mockReturnValue(selectChain);
      selectChain.select.mockResolvedValue(mockGoogleUser);

      // Act & Assert
      await expect(authService.login(loginData)).rejects.toThrow(UnauthorizedError);
      await expect(authService.login(loginData)).rejects.toThrow('Please login with Google');
    });
  });

  describe('getProfile', () => {
    it('should successfully return user profile', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      const mockUser = createMockUser({
        _id: new Types.ObjectId(userId),
        email: 'user@example.com',
        name: 'Test User',
        phone: '+1234567890',
        role: 'owner',
        isVerified: true,
      });

      mockUserModel.findById.mockResolvedValue(mockUser);

      // Act
      const result = await authService.getProfile(userId);

      // Assert
      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', mockUser.email);
      expect(result).toHaveProperty('name', mockUser.name);
      expect(result).toHaveProperty('phone', mockUser.phone);
      expect(result).toHaveProperty('role', mockUser.role);
      expect(result).toHaveProperty('isVerified', mockUser.isVerified);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      const userId = new Types.ObjectId().toString();
      mockUserModel.findById.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.getProfile(userId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('updateProfile', () => {
    const userId = new Types.ObjectId().toString();
    const updateData = {
      name: 'Updated Name',
      phone: '+9876543210',
    };

    it('should successfully update user profile', async () => {
      // Arrange
      const mockUpdatedUser = createMockUser({
        _id: new Types.ObjectId(userId),
        name: updateData.name,
        phone: updateData.phone,
      });

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await authService.updateProfile(userId, updateData);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { name: updateData.name, phone: updateData.phone },
        { new: true, runValidators: true }
      );
      expect(result.name).toBe(updateData.name);
      expect(result.phone).toBe(updateData.phone);
    });

    it('should throw NotFoundError when user does not exist', async () => {
      // Arrange
      mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.updateProfile(userId, updateData)).rejects.toThrow(NotFoundError);
    });

    it('should update only provided fields', async () => {
      // Arrange
      const partialUpdate = { name: 'Only Name Update' };
      const mockUpdatedUser = createMockUser({
        _id: new Types.ObjectId(userId),
        name: partialUpdate.name,
        phone: '+1234567890', // Original phone
      });

      mockUserModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await authService.updateProfile(userId, partialUpdate);

      // Assert
      expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
        userId,
        { name: partialUpdate.name, phone: undefined },
        { new: true, runValidators: true }
      );
      expect(result.name).toBe(partialUpdate.name);
    });
  });

  describe('generateAuthResponse', () => {
    it('should generate auth response for a user', async () => {
      // Arrange
      const mockUser = createMockUser({
        _id: new Types.ObjectId(),
        email: 'user@example.com',
        name: 'Test User',
        role: 'owner',
        avatar: 'https://example.com/avatar.jpg',
      });

      // Act
      const result = await authService.generateAuthResponse(mockUser as any);

      // Assert
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('id');
      expect(result.user).toHaveProperty('email', mockUser.email);
      expect(result.user).toHaveProperty('name', mockUser.name);
      expect(result.user).toHaveProperty('role', mockUser.role);
      expect(result.user).toHaveProperty('avatar', mockUser.avatar);
    });

    it('should handle user without avatar', async () => {
      // Arrange
      const mockUser = createMockUser({
        avatar: undefined,
      });

      // Act
      const result = await authService.generateAuthResponse(mockUser as any);

      // Assert
      expect(result.user.avatar).toBeUndefined();
    });
  });
});
