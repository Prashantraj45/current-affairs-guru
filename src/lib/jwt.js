import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { secretManager } from '../../config/secrets.js';

const ACCESS_TTL = '15m';
const REFRESH_TTL = '30d';

export function signAccessToken(payload) {
  return jwt.sign(payload, secretManager.get('JWT_SECRET'), { expiresIn: ACCESS_TTL });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, secretManager.get('JWT_REFRESH_SECRET'), { expiresIn: REFRESH_TTL });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, secretManager.get('JWT_SECRET'));
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, secretManager.get('JWT_REFRESH_SECRET'));
}

export async function hashToken(token) {
  return bcrypt.hash(token, 10);
}

export async function compareToken(token, hash) {
  return bcrypt.compare(token, hash);
}

export function issueTokenPair(uid, email) {
  const accessToken = signAccessToken({ uid, email });
  const refreshToken = signRefreshToken({ uid, email });
  return { accessToken, refreshToken };
}
