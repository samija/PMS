import { Model } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IUser } from '../../types/index.js';
import { generateToken } from '../../middleware/auth.js';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../domain/exceptions/AppError.js';
import {
  IAuthService,
  RegisterData,
  LoginData,
  UpdateProfileData,
  AuthResponse,
  UserProfile,
} from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

// Re-export interfaces for backward compatibility
export type { RegisterData, LoginData, UpdateProfileData, AuthResponse, UserProfile };

@injectable()
export class AuthService implements IAuthService {
  private userModel: Model<IUser>;

  constructor(@inject(TYPES.UserModel) userModel: Model<IUser>) {
    this.userModel = userModel;
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    // Check if user exists
    const existingUser = await this.userModel.findOne({ email: data.email });
    if (existingUser) {
      throw new ConflictError('Email already registered');
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
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user used OAuth
    if (user.authProvider === 'google' && !user.password) {
      throw new UnauthorizedError('Please login with Google');
    }

    // Verify password
    const isMatch = await user.comparePassword(data.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
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

  async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  async updateProfile(userId: string, data: UpdateProfileData): Promise<UserProfile> {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { name: data.name, phone: data.phone },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
    };
  }

  async generateAuthResponse(user: IUser): Promise<AuthResponse> {
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
