import { env } from '../config/env.js';
import {
  login,
  logout,
  logoutAll,
  rotateRefreshToken
} from '../services/auth.service.js';
import { success } from '../utils/api-response.js';

function requestContext(request) {
  return {
    ip: request.ip,
    userAgent: request.get('user-agent'),
    method: request.method,
    path: request.originalUrl
  };
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    path: `${env.apiPrefix}/auth`,
    maxAge: env.refreshTokenExpiresDays * 24 * 60 * 60 * 1000
  };
}

function setRefreshCookie(response, token) {
  response.cookie(env.refreshCookieName, token, cookieOptions());
}

function clearRefreshCookie(response) {
  response.clearCookie(env.refreshCookieName, cookieOptions());
}

function getRefreshToken(request) {
  return request.cookies?.[env.refreshCookieName] || request.body?.refreshToken;
}

export async function loginController(request, response) {
  const session = await login(
    request.body.email,
    request.body.password,
    requestContext(request)
  );
  setRefreshCookie(response, session.refreshToken);
  return success(response, session);
}

export async function refreshController(request, response) {
  const session = await rotateRefreshToken(
    getRefreshToken(request),
    requestContext(request)
  );
  setRefreshCookie(response, session.refreshToken);
  return success(response, session);
}

export async function logoutController(request, response) {
  await logout(getRefreshToken(request), requestContext(request));
  clearRefreshCookie(response);
  return success(response, null, { message: 'Session ended successfully.' });
}

export async function logoutAllController(request, response) {
  await logoutAll(request.user.id, requestContext(request));
  clearRefreshCookie(response);
  return success(response, null, { message: 'All sessions ended successfully.' });
}

export async function meController(request, response) {
  return success(response, {
    ...request.user,
    permissions: [...request.user.permissions]
  });
}
