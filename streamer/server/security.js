import crypto from 'node:crypto';

const COOKIE_NAME = 'bcr_upload_session';
const SESSION_TTL_SECONDS = 8 * 60 * 60;

function digest(value) {
  return crypto.createHash('sha256').update(String(value)).digest();
}

export function safeEqual(left, right) {
  return crypto.timingSafeEqual(digest(left), digest(right));
}

function signature(expiresAt, secret) {
  return crypto.createHmac('sha256', secret).update(String(expiresAt)).digest('hex');
}

export function makeSessionCookie(secret, isSecure = false, nowMs = Date.now()) {
  const expiresAt = Math.floor(nowMs / 1000) + SESSION_TTL_SECONDS;
  const value = `${expiresAt}.${signature(expiresAt, secret)}`;
  const securePart = isSecure ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_SECONDS}${securePart}`;
}

export function clearSessionCookie(isSecure = false) {
  const securePart = isSecure ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${securePart}`;
}

export function hasValidSession(cookieHeader, secret, nowMs = Date.now()) {
  if (!cookieHeader || !secret) return false;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${COOKIE_NAME}=`));
  if (!cookie) return false;
  const token = cookie.slice(COOKIE_NAME.length + 1);
  const dot = token.indexOf('.');
  if (dot < 1) return false;
  const expiresAt = token.slice(0, dot);
  const suppliedSig = token.slice(dot + 1);
  const expiry = Number(expiresAt);
  if (!Number.isInteger(expiry) || expiry <= Math.floor(nowMs / 1000)) return false;
  const expectedSig = signature(expiresAt, secret);
  if (suppliedSig.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(suppliedSig), Buffer.from(expectedSig));
}

export const sessionCookieName = COOKIE_NAME;
