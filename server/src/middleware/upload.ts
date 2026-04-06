import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import { Request } from 'express';
import logger from '../config/logger.js';

// Storage for property images
const propertyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'enderase/properties',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 800, crop: 'limit' }],
    };
  },
});

// Storage for unit images
const unitStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'enderase/units',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      transformation: [{ width: 1200, height: 800, crop: 'limit' }],
    };
  },
});

// Storage for payment receipts
const receiptStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    return {
      folder: 'enderase/receipts',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      transformation: [{ width: 1500, height: 2000, crop: 'limit' }],
    };
  },
});

// Storage for tenant documents
const tenantDocumentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req: Request, file: Express.Multer.File) => {
    const isPdf = file.mimetype === 'application/pdf';
    return {
      folder: 'enderase/tenant-documents',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      resource_type: isPdf ? 'raw' : 'image',
      transformation: isPdf ? [] : [{ width: 1500, height: 2000, crop: 'limit' }],
    };
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

export const uploadPropertyImages = multer({
  storage: propertyStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadUnitImages = multer({
  storage: unitStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

// File filter for receipts (includes PDF)
const receiptFileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WebP, and PDF are allowed.'));
  }
};

export const uploadPaymentReceipt = multer({
  storage: receiptStorage,
  fileFilter: receiptFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for receipts
  },
});

export const uploadTenantDocument = multer({
  storage: tenantDocumentStorage,
  fileFilter: receiptFileFilter, // Reuse same filter (allows images + PDF)
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Utility function to delete images from Cloudinary
export const deleteCloudinaryImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract public_id from URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const publicId = `enderase/${urlParts[urlParts.length - 2]}/${fileName.split('.')[0]}`;

    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error('Error deleting image from Cloudinary:', error);
    throw error;
  }
};
