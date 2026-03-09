import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'zionn-secret-key-2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'zionn-refresh-secret-key-2026';

// Token expiration times
export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

// Token blacklist for logout
const tokenBlacklist = new Set<string>();

// Refresh token storage (in production, use Redis or database)
interface RefreshToken {
  token: string;
  userId: string;
  expiresAt: number;
  createdAt: number;
  revoked: boolean;
}

const refreshTokens: Map<string, RefreshToken> = new Map();

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(userId: string): string {
  const token = uuidv4();
  const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
  
  refreshTokens.set(token, {
    token,
    userId,
    expiresAt,
    createdAt: Date.now(),
    revoked: false,
  });
  
  return token;
}

export function generateAuthTokens(payload: TokenPayload): AuthTokens {
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload.userId);
  
  // Decode access token to get expiration time
  const decoded = jwt.decode(accessToken) as any;
  const expiresIn = decoded?.exp ? decoded.exp * 1000 - Date.now() : 15 * 60 * 1000;
  
  return {
    accessToken,
    refreshToken,
    expiresIn,
  };
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    // Check if token is blacklisted
    if (tokenBlacklist.has(token)) {
      return null;
    }
    
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    return null;
  }
}

export function verifyRefreshToken(token: string): { userId: string } | null {
  const storedToken = refreshTokens.get(token);
  
  if (!storedToken) {
    return null;
  }
  
  if (storedToken.revoked || storedToken.expiresAt < Date.now()) {
    refreshTokens.delete(token);
    return null;
  }
  
  return { userId: storedToken.userId };
}

export function refreshAccessToken(refreshToken: string): AuthTokens | null {
  const result = verifyRefreshToken(refreshToken);
  
  if (!result) {
    return null;
  }
  
  // Get user data from database (would need to fetch from DB in real implementation)
  // For now, we'll need to pass user data differently
  // In production, you'd fetch user from database using userId
  
  return null; // This needs user data from DB
}

export function revokeRefreshToken(token: string): boolean {
  const storedToken = refreshTokens.get(token);
  
  if (storedToken) {
    storedToken.revoked = true;
    refreshTokens.delete(token);
    return true;
  }
  
  return false;
}

export function revokeAllUserTokens(userId: string): number {
  let count = 0;
  
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      data.revoked = true;
      refreshTokens.delete(token);
      count++;
    }
  }
  
  return count;
}

export function addToBlacklist(token: string): void {
  tokenBlacklist.add(token);
  
  // Clean up old blacklist entries periodically
  if (tokenBlacklist.size > 1000) {
    const tokensArray = Array.from(tokenBlacklist);
    const oldTokens = tokensArray.slice(0, 500);
    oldTokens.forEach(t => tokenBlacklist.delete(t));
  }
}

export function isTokenBlacklisted(token: string): boolean {
  return tokenBlacklist.has(token);
}

// Middleware to check token freshness
export function isTokenFresh(token: string, maxAge: number = 30 * 60 * 1000): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded?.iat) return false;
    
    const tokenAge = Date.now() - (decoded.iat * 1000);
    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

// Password reset token generation
export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'password_reset' }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyPasswordResetToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'password_reset') return null;
    return { userId: decoded.userId };
  } catch {
    return null;
  }
}

// Email verification token
export function generateEmailVerificationToken(userId: string, email: string): string {
  return jwt.sign({ userId, email, type: 'email_verification' }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyEmailVerificationToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.type !== 'email_verification') return null;
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}
