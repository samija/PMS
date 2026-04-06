import { Model, Types } from 'mongoose';
import { injectable, inject } from 'inversify';
import { IOwnerPaymentSettings, PreferredPaymentMethod, IBankDetails } from '../../types/index.js';
import { NotFoundError, BadRequestError } from '../../domain/exceptions/AppError.js';
import { IOwnerSettingsService } from '../../domain/interfaces/IServices.js';
import TYPES from '../../config/types.js';

export interface UpdatePaymentSettingsData {
  preferredPaymentMethod?: PreferredPaymentMethod;
  bankDetails?: IBankDetails;
  paymentInstructions?: string;
  isActive?: boolean;
}

export interface PublicPaymentInfo {
  preferredPaymentMethod: PreferredPaymentMethod;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountHolderName: string;
  };
  paymentInstructions?: string;
}

@injectable()
export class OwnerSettingsService implements IOwnerSettingsService {
  private ownerPaymentSettingsModel: Model<IOwnerPaymentSettings>;

  constructor(
    @inject(TYPES.OwnerPaymentSettingsModel) ownerPaymentSettingsModel: Model<IOwnerPaymentSettings>
  ) {
    this.ownerPaymentSettingsModel = ownerPaymentSettingsModel;
  }

  /**
   * Get payment settings for an owner
   */
  async getPaymentSettings(ownerId: string): Promise<IOwnerPaymentSettings | null> {
    const settings = await this.ownerPaymentSettingsModel
      .findOne({ ownerId: new Types.ObjectId(ownerId) })
      .lean();

    return settings as IOwnerPaymentSettings | null;
  }

  /**
   * Create or update payment settings for an owner
   */
  async updatePaymentSettings(
    ownerId: string,
    data: UpdatePaymentSettingsData
  ): Promise<IOwnerPaymentSettings> {
    // Validate bank details if bank_transfer is selected
    if (data.preferredPaymentMethod === 'bank_transfer' && !data.bankDetails) {
      // Check if existing settings have bank details
      const existingSettings = await this.ownerPaymentSettingsModel.findOne({
        ownerId: new Types.ObjectId(ownerId),
      });

      if (!existingSettings?.bankDetails) {
        throw new BadRequestError(
          'Bank details are required when bank transfer is the preferred payment method'
        );
      }
    }

    // Validate bank details fields if provided
    if (data.bankDetails) {
      if (!data.bankDetails.bankName || !data.bankDetails.accountNumber || !data.bankDetails.accountHolderName) {
        throw new BadRequestError(
          'Bank name, account number, and account holder name are required'
        );
      }
    }

    const settings = await this.ownerPaymentSettingsModel.findOneAndUpdate(
      { ownerId: new Types.ObjectId(ownerId) },
      {
        $set: {
          preferredPaymentMethod: data.preferredPaymentMethod,
          bankDetails: data.bankDetails,
          paymentInstructions: data.paymentInstructions,
          isActive: data.isActive ?? true,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    return settings;
  }

  /**
   * Get sanitized payment info for tenants (hides sensitive details if needed)
   */
  async getSettingsForTenant(ownerId: string): Promise<PublicPaymentInfo | null> {
    const settings = await this.ownerPaymentSettingsModel
      .findOne({ ownerId: new Types.ObjectId(ownerId), isActive: true })
      .lean();

    if (!settings) {
      return null;
    }

    // Return public-facing payment info
    const publicInfo: PublicPaymentInfo = {
      preferredPaymentMethod: settings.preferredPaymentMethod,
      paymentInstructions: settings.paymentInstructions,
    };

    // Include bank details for bank transfer
    if (settings.bankDetails) {
      publicInfo.bankDetails = {
        bankName: settings.bankDetails.bankName,
        accountNumber: settings.bankDetails.accountNumber,
        accountHolderName: settings.bankDetails.accountHolderName,
      };
    }

    return publicInfo;
  }

  /**
   * Check if owner has complete payment settings
   */
  async hasCompleteSettings(ownerId: string): Promise<boolean> {
    const settings = await this.ownerPaymentSettingsModel
      .findOne({ ownerId: new Types.ObjectId(ownerId), isActive: true })
      .lean();

    if (!settings) return false;

    // For bank transfer, bank details must be complete
    if (settings.preferredPaymentMethod === 'bank_transfer') {
      return !!(
        settings.bankDetails?.bankName &&
        settings.bankDetails?.accountNumber &&
        settings.bankDetails?.accountHolderName
      );
    }

    return true;
  }
}
