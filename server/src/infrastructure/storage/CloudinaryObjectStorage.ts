import { injectable } from 'inversify';
import cloudinary from '../../config/cloudinary.js';
import logger from '../../config/logger.js';

export interface UploadResult {
  url?: string;
  storageRef: string;
  bytes: number;
}

@injectable()
export class CloudinaryObjectStorage {
  async uploadPublic(buffer: Buffer, folder: string, filename: string, mime: string): Promise<UploadResult> {
    const resourceType = mime === 'application/pdf' ? 'raw' : 'image';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: resourceType as any,
        },
        (err, result) => {
          if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
          resolve({
            url: result.secure_url,
            storageRef: result.public_id,
            bytes: result.bytes,
          });
        }
      );
      stream.end(buffer);
    });
  }

  async uploadSensitive(buffer: Buffer, folder: string, filename: string, mime: string): Promise<UploadResult> {
    const resourceType = mime === 'application/pdf' ? 'raw' : 'image';
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          public_id: filename,
          resource_type: resourceType as any,
          type: 'authenticated',
        },
        (err, result) => {
          if (err || !result) return reject(err || new Error('Cloudinary upload failed'));
          resolve({
            storageRef: result.public_id,
            bytes: result.bytes,
          });
        }
      );
      stream.end(buffer);
    });
  }

  getSignedUrl(storageRef: string, ttlSeconds: number = 900): string {
    const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
    return cloudinary.url(storageRef, {
      sign_url: true,
      type: 'authenticated',
      resource_type: 'auto',
      secure: true,
      expires_at: expiresAt,
    } as any);
  }

  async delete(storageRef: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(storageRef, { resource_type: 'auto', type: 'authenticated' } as any);
    } catch (error) {
      logger.error('Failed to delete Cloudinary asset', { storageRef, error });
    }
  }
}
