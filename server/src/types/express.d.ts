import { IUser, IProperty, IPropertyStaff } from './index.js';

declare global {
  namespace Express {
    // Merge IUser properties into Express.User so req.user has the correct type
    interface User extends IUser {}

    interface Request {
      user?: User;
      property?: IProperty;
      staffAssignment?: IPropertyStaff;
      accessLevel?: 'owner' | 'manager' | 'marketing' | 'technician' | 'guard' | 'cleaner' | 'admin';
      requestId?: string;
    }
  }
}

export {};
