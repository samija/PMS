import { Request, Response, NextFunction } from 'express';
import { randomBytes } from 'crypto';
import { AuthService } from '../application/services/AuthService.js';
import container from '../config/container.js';
import TYPES from '../config/types.js';
import logger from '../config/logger.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: '/',
};

// In-memory store for one-time authorization codes (code -> { token, expiresAt })
const authCodeStore = new Map<string, { token: string; expiresAt: number }>();
const AUTH_CODE_TTL_MS = 60_000; // 60 seconds

function generateAuthCode(token: string): string {
  const code = randomBytes(32).toString('hex');
  authCodeStore.set(code, { token, expiresAt: Date.now() + AUTH_CODE_TTL_MS });
  // Clean up expired codes lazily
  for (const [k, v] of authCodeStore) {
    if (v.expiresAt < Date.now()) {
      authCodeStore.delete(k);
    }
  }
  return code;
}

const authService = container.get<AuthService>(TYPES.AuthService);

export const register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.register(req.body);

    res.cookie('token', result.token, COOKIE_OPTIONS);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await authService.login(req.body);

    res.cookie('token', result.token, COOKIE_OPTIONS);
    res.json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const profile = await authService.getProfile(userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id.toString();
    if (!userId) {
      res.status(401).json({
        success: false,
        message: 'Not authenticated',
      });
      return;
    }

    const profile = await authService.updateProfile(userId, req.body);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const googleCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    const result = await authService.generateAuthResponse(user);

    // Set the httpOnly cookie so the frontend is authenticated after redirect
    res.cookie('token', result.token, COOKIE_OPTIONS);

    // Generate a short-lived one-time code to avoid exposing the JWT in the URL
    const code = generateAuthCode(result.token);
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?code=${code}`);
  } catch (error) {
    logger.error('Google callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
  }
};

export const exchangeCode = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code || typeof code !== 'string') {
    res.status(400).json({ success: false, message: 'Authorization code is required' });
    return;
  }

  const entry = authCodeStore.get(code);

  if (!entry) {
    res.status(400).json({ success: false, message: 'Invalid or expired authorization code' });
    return;
  }

  if (entry.expiresAt < Date.now()) {
    authCodeStore.delete(code);
    res.status(400).json({ success: false, message: 'Authorization code has expired' });
    return;
  }

  // Consume the code (one-time use)
  authCodeStore.delete(code);

  res.cookie('token', entry.token, COOKIE_OPTIONS);
  res.json({ success: true, data: { token: entry.token } });
};

export const logout = async (_req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

export default {
  register,
  login,
  getProfile,
  updateProfile,
  googleCallback,
  exchangeCode,
  logout,
};
