import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const rawFrontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const parsedAllowedOrigins = rawFrontendUrl
  .split(',')
  .map((url) => url.trim().replace(/\/+$/, ''))
  .filter(Boolean);

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/swapwear_db?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_swapwear_secret_key_at_least_32_chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  COOKIE_SECRET: process.env.COOKIE_SECRET || 'fallback_cookie_secret_swapwear_2026',
  FRONTEND_URL: parsedAllowedOrigins[0] || 'http://localhost:3000',
  ALLOWED_ORIGINS: parsedAllowedOrigins.length > 0 ? parsedAllowedOrigins : ['http://localhost:3000'],
  isProduction: process.env.NODE_ENV === 'production',
  AI_PROVIDER: process.env.AI_PROVIDER || 'gemini',
  AI_API_KEY: process.env.AI_API_KEY || '',
  AI_MODEL: process.env.AI_MODEL || 'gemini-3.1-flash-lite',
  AI_WEIGHT: process.env.AI_WEIGHT ? parseFloat(process.env.AI_WEIGHT) : 0.30,
  RULE_WEIGHT: process.env.RULE_WEIGHT ? parseFloat(process.env.RULE_WEIGHT) : 0.70,
};

export function isOriginAllowed(origin?: string): boolean {
  if (!origin) return true;
  const normalized = origin.trim().replace(/\/+$/, '');
  if (env.ALLOWED_ORIGINS.includes(normalized)) return true;
  if (!env.isProduction) {
    if (normalized.startsWith('http://localhost:') || normalized.startsWith('http://127.0.0.1:')) {
      return true;
    }
  }
  return false;
}
