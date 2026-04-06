import { Request, Response, NextFunction } from 'express';
import Property from '../models/Property.js';
import Unit from '../models/Unit.js';
import PropertyStaff from '../models/PropertyStaff.js';
import { PropertyService } from '../application/services/PropertyService.js';
import { deleteCloudinaryImage } from '../middleware/upload.js';
import { BadRequestError } from '../domain/exceptions/AppError.js';

// Create service instance
const propertyService = new PropertyService(Property, Unit, PropertyStaff);

export const createProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ownerId = req.user?._id.toString();
    if (!ownerId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const files = req.files as Express.Multer.File[];
    const images = files ? files.map((file: any) => file.path) : [];

    // Parse address and amenities if they're JSON strings (from multipart form data)
    const parsedAddress = typeof req.body.address === 'string'
      ? JSON.parse(req.body.address)
      : req.body.address;
    const parsedAmenities = req.body.amenities
      ? (typeof req.body.amenities === 'string' ? JSON.parse(req.body.amenities) : req.body.amenities)
      : [];

    const property = await propertyService.createProperty({
      ownerId,
      ...req.body,
      address: parsedAddress,
      amenities: parsedAmenities,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const getProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const result = await propertyService.getProperties(userId, userRole, req.query);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const property = await propertyService.getProperty(id, userId);

    res.json({
      success: true,
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const property = await propertyService.updateProperty(id, userId, req.body);

    res.json({
      success: true,
      message: 'Property updated successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProperty = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await propertyService.deleteProperty(id, userId);

    res.json({
      success: true,
      message: 'Property deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const toggleListing = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const property = await propertyService.toggleListing(id, userId);

    res.json({
      success: true,
      message: property.isListed ? 'Property is now listed' : 'Property is now unlisted',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

// Unit Management
export const addUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const files = req.files as Express.Multer.File[];
    const images = files ? files.map((file: any) => file.path) : [];

    // Parse features if it's a JSON string (from multipart form data)
    const parsedFeatures = req.body.features
      ? (typeof req.body.features === 'string' ? JSON.parse(req.body.features) : req.body.features)
      : [];

    const unit = await propertyService.addUnit({
      propertyId,
      ...req.body,
      features: parsedFeatures,
      images,
    });

    res.status(201).json({
      success: true,
      message: 'Unit added successfully',
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const getUnits = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const units = await propertyService.getUnits(propertyId, userId, req.query);

    res.json({
      success: true,
      data: units,
    });
  } catch (error) {
    next(error);
  }
};

export const updateUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId, unitId } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const unit = await propertyService.updateUnit(propertyId, unitId, userId, req.body);

    res.json({
      success: true,
      message: 'Unit updated successfully',
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUnit = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId, unitId } = req.params;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    await propertyService.deleteUnit(propertyId, unitId, userId);

    res.json({
      success: true,
      message: 'Unit deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Image Upload
export const uploadPropertyImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new BadRequestError('No images provided');
    }

    const imageUrls = files.map((file: any) => file.path);
    const property = await propertyService.addPropertyImages(propertyId, imageUrls);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        uploadedImages: imageUrls,
        property,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deletePropertyImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const { imageUrl } = req.body;

    // Delete from Cloudinary
    await deleteCloudinaryImage(imageUrl);

    const property = await propertyService.deletePropertyImage(propertyId, imageUrl);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadUnitImages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId, unitId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      throw new BadRequestError('No images provided');
    }

    const imageUrls = files.map((file: any) => file.path);
    const unit = await propertyService.addUnitImages(propertyId, unitId, imageUrls);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      data: {
        uploadedImages: imageUrls,
        unit,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteUnitImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId, unitId } = req.params;
    const { imageUrl } = req.body;

    await deleteCloudinaryImage(imageUrl);

    const unit = await propertyService.deleteUnitImage(propertyId, unitId, imageUrl);

    res.json({
      success: true,
      message: 'Image deleted successfully',
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export const setPrimaryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const { imageUrl } = req.body;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!imageUrl) {
      throw new BadRequestError('Image URL is required');
    }

    const property = await propertyService.setPrimaryImage(propertyId, userId, imageUrl);

    res.json({
      success: true,
      message: 'Primary image set successfully',
      data: property,
    });
  } catch (error) {
    next(error);
  }
};

export const setUnitPrimaryImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id: propertyId, unitId } = req.params;
    const { imageUrl } = req.body;
    const userId = req.user?._id.toString();

    if (!userId) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    if (!imageUrl) {
      throw new BadRequestError('Image URL is required');
    }

    const unit = await propertyService.setUnitPrimaryImage(propertyId, unitId, userId, imageUrl);

    res.json({
      success: true,
      message: 'Primary image set successfully',
      data: unit,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createProperty,
  getProperties,
  getProperty,
  updateProperty,
  deleteProperty,
  toggleListing,
  addUnit,
  getUnits,
  updateUnit,
  deleteUnit,
  uploadPropertyImages,
  deletePropertyImage,
  uploadUnitImages,
  deleteUnitImage,
  setPrimaryImage,
  setUnitPrimaryImage,
};
