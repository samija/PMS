import { Request, Response } from 'express';
import PropertyStaff from '../models/PropertyStaff.js';
import User from '../models/User.js';

export const addStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const assignedBy = req.user?._id;
    const { userId, role, permissions } = req.body;

    // Verify the user exists and has appropriate role
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    // Check if user role matches the assigned role or is compatible
    const validRoles = ['manager', 'marketing', 'technician', 'guard', 'cleaner'];
    if (!validRoles.includes(user.role) && user.role !== role) {
      res.status(400).json({
        success: false,
        message: `User must have a compatible role. Current role: ${user.role}`,
      });
      return;
    }

    // Check if staff already assigned
    const existing = await PropertyStaff.findOne({ propertyId, userId });
    if (existing) {
      res.status(400).json({
        success: false,
        message: 'User is already assigned to this property',
      });
      return;
    }

    // Create staff assignment
    const staff = await PropertyStaff.create({
      propertyId,
      userId,
      role,
      assignedBy,
      permissions: permissions || [],
      isActive: true,
    });

    const populatedStaff = await PropertyStaff.findById(staff._id)
      .populate('userId', 'name email phone role')
      .populate('assignedBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Staff added successfully',
      data: populatedStaff,
    });
  } catch (error: any) {
    console.error('Add staff error:', error);
    if (error.code === 11000) {
      res.status(400).json({
        success: false,
        message: 'Staff member already assigned to this property',
      });
      return;
    }
    res.status(500).json({
      success: false,
      message: 'Failed to add staff',
    });
  }
};

export const getPropertyStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: propertyId } = req.params;
    const { role, isActive = true } = req.query;

    const query: any = { propertyId };
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const staff = await PropertyStaff.find(query)
      .populate('userId', 'name email phone role avatar')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: staff,
    });
  } catch (error) {
    console.error('Get property staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get property staff',
    });
  }
};

export const updateStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: propertyId, staffId } = req.params;
    const { role, permissions, isActive } = req.body;

    const updates: any = {};
    if (role) updates.role = role;
    if (permissions) updates.permissions = permissions;
    if (isActive !== undefined) updates.isActive = isActive;

    const staff = await PropertyStaff.findOneAndUpdate(
      { _id: staffId, propertyId },
      updates,
      { new: true }
    )
      .populate('userId', 'name email phone role')
      .populate('assignedBy', 'name email');

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff assignment not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Staff updated successfully',
      data: staff,
    });
  } catch (error) {
    console.error('Update staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update staff',
    });
  }
};

export const removeStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: propertyId, staffId } = req.params;

    const staff = await PropertyStaff.findOneAndDelete({
      _id: staffId,
      propertyId,
    });

    if (!staff) {
      res.status(404).json({
        success: false,
        message: 'Staff assignment not found',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Staff removed successfully',
    });
  } catch (error) {
    console.error('Remove staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove staff',
    });
  }
};

export const getStaffProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?._id;

    const assignments = await PropertyStaff.find({ userId, isActive: true })
      .populate('propertyId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: assignments,
    });
  } catch (error) {
    console.error('Get staff properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties',
    });
  }
};

export const getAllStaff = async (req: Request, res: Response): Promise<void> => {
  try {
    // Admin only
    if (req.user?.role !== 'admin') {
      res.status(403).json({
        success: false,
        message: 'Admin access required',
      });
      return;
    }

    const { page = 1, limit = 10, role } = req.query;
    const query: any = {};
    if (role) query.role = role;

    const skip = (Number(page) - 1) * Number(limit);

    const [staff, total] = await Promise.all([
      PropertyStaff.find(query)
        .populate('userId', 'name email phone role')
        .populate('propertyId', 'name address')
        .populate('assignedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      PropertyStaff.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        staff,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    console.error('Get all staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get staff',
    });
  }
};
