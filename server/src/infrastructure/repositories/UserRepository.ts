import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IUser, UserRole, AuthProvider } from '../../types/index.js';
import { BaseRepository } from './BaseRepository.js';
import { IUserRepository } from '../../domain/interfaces/IRepositories.js';
import TYPES from '../../config/types.js';

/**
 * User Repository
 * Provides data access methods for User entities.
 * Extends BaseRepository with user-specific query methods.
 */
@injectable()
export class UserRepository extends BaseRepository<IUser> implements IUserRepository {
  constructor(@inject(TYPES.UserModel) model: Model<IUser>) {
    super(model);
  }

  /**
   * Find a user by email address
   * @param email - The email address to search for
   * @param includePassword - Whether to include the password field (default: false)
   * @returns The user or null if not found
   */
  async findByEmail(email: string, includePassword: boolean = false): Promise<IUser | null> {
    const query = this.model.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select('+password');
    }
    return query.exec();
  }

  /**
   * Find a user by Google ID
   * @param googleId - The Google OAuth ID
   * @returns The user or null if not found
   */
  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return this.model.findOne({ googleId }).exec();
  }

  /**
   * Find users by role
   * @param role - The user role to filter by
   * @returns Array of users with the specified role
   */
  async findByRole(role: UserRole): Promise<IUser[]> {
    return this.model.find({ role }).exec();
  }

  /**
   * Find users by multiple roles
   * @param roles - Array of user roles to filter by
   * @returns Array of users matching any of the specified roles
   */
  async findByRoles(roles: UserRole[]): Promise<IUser[]> {
    return this.model.find({ role: { $in: roles } }).exec();
  }

  /**
   * Find users by authentication provider
   * @param provider - The auth provider (local, google)
   * @returns Array of users using the specified provider
   */
  async findByAuthProvider(provider: AuthProvider): Promise<IUser[]> {
    return this.model.find({ authProvider: provider }).exec();
  }

  /**
   * Find verified users
   * @returns Array of verified users
   */
  async findVerified(): Promise<IUser[]> {
    return this.model.find({ isVerified: true }).exec();
  }

  /**
   * Find unverified users
   * @returns Array of unverified users
   */
  async findUnverified(): Promise<IUser[]> {
    return this.model.find({ isVerified: false }).exec();
  }

  /**
   * Check if email exists
   * @param email - The email to check
   * @returns True if email exists, false otherwise
   */
  async emailExists(email: string): Promise<boolean> {
    const result = await this.model.exists({ email: email.toLowerCase() });
    return result !== null;
  }

  /**
   * Update user verification status
   * @param userId - The user ID
   * @param isVerified - The verification status to set
   * @returns The updated user or null
   */
  async updateVerificationStatus(
    userId: string | Types.ObjectId,
    isVerified: boolean
  ): Promise<IUser | null> {
    return this.update(userId, { isVerified });
  }

  /**
   * Update user profile
   * @param userId - The user ID
   * @param data - Profile data to update (name, phone, avatar)
   * @returns The updated user or null
   */
  async updateProfile(
    userId: string | Types.ObjectId,
    data: { name?: string; phone?: string; avatar?: string }
  ): Promise<IUser | null> {
    return this.update(userId, data);
  }

  /**
   * Update user password
   * Note: The password will be hashed by the User model's pre-save hook
   * @param userId - The user ID
   * @param password - The new password
   * @returns The updated user or null
   */
  async updatePassword(
    userId: string | Types.ObjectId,
    password: string
  ): Promise<IUser | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    user.password = password;
    return user.save();
  }

  /**
   * Search users by name or email
   * @param searchTerm - The search term
   * @param role - Optional role filter
   * @returns Array of matching users
   */
  async search(searchTerm: string, role?: UserRole): Promise<IUser[]> {
    const searchRegex = new RegExp(searchTerm, 'i');
    const filter: any = {
      $or: [
        { name: searchRegex },
        { email: searchRegex },
      ],
    };

    if (role) {
      filter.role = role;
    }

    return this.model.find(filter).exec();
  }

  /**
   * Create user with OAuth provider
   * @param data - User data including OAuth information
   * @returns The created user
   */
  async createOAuthUser(data: {
    email: string;
    name: string;
    googleId: string;
    avatar?: string;
    role?: UserRole;
  }): Promise<IUser> {
    return this.create({
      email: data.email.toLowerCase(),
      name: data.name,
      googleId: data.googleId,
      avatar: data.avatar,
      role: data.role || 'owner',
      authProvider: 'google',
      isVerified: true,
    } as Partial<IUser>);
  }

  /**
   * Find or create user by OAuth provider
   * @param googleId - The Google OAuth ID
   * @param data - User data to create if not found
   * @returns The existing or newly created user
   */
  async findOrCreateByGoogleId(
    googleId: string,
    data: {
      email: string;
      name: string;
      avatar?: string;
    }
  ): Promise<IUser> {
    let user = await this.findByGoogleId(googleId);

    if (!user) {
      // Check if user exists by email
      user = await this.findByEmail(data.email);

      if (user) {
        // Link Google account to existing user
        user.googleId = googleId;
        user.authProvider = 'google';
        if (data.avatar && !user.avatar) {
          user.avatar = data.avatar;
        }
        await user.save();
      } else {
        // Create new user
        user = await this.createOAuthUser({
          email: data.email,
          name: data.name,
          googleId,
          avatar: data.avatar,
        });
      }
    }

    return user;
  }

  /**
   * Get user count by role
   * @returns Object with counts per role
   */
  async getCountByRole(): Promise<Record<UserRole, number>> {
    const result = await this.aggregate<{ _id: UserRole; count: number }>([
      { $group: { _id: '$role', count: { $sum: 1 } } },
    ]);

    const counts: Record<UserRole, number> = {
      owner: 0,
      tenant: 0,
      admin: 0,
      technician: 0,
      marketing: 0,
      manager: 0,
      guard: 0,
      cleaner: 0,
    };

    result.forEach((r) => {
      counts[r._id] = r.count;
    });

    return counts;
  }
}
