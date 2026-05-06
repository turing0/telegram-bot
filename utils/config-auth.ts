import { createHash, timingSafeEqual } from 'crypto';

export const CONFIG_AUTH_COOKIE = 'config_auth';

function getConfigPassword() {
  return process.env.CONFIG_PAGE_PASSWORD || '';
}

function getAuthToken() {
  const password = getConfigPassword();

  if (!password) {
    return '';
  }

  return createHash('sha256').update(`config-page:${password}`).digest('hex');
}

function parseCookies(cookieHeader = '') {
  return cookieHeader.split(';').reduce<Record<string, string>>((cookies, cookie) => {
    const [name, ...value] = cookie.trim().split('=');

    if (name) {
      cookies[name] = decodeURIComponent(value.join('='));
    }

    return cookies;
  }, {});
}

function safeEqual(a: string, b: string) {
  const first = Buffer.from(a);
  const second = Buffer.from(b);

  return first.length === second.length && timingSafeEqual(first, second);
}

export function isConfigPasswordSet() {
  return Boolean(getConfigPassword());
}

export function isValidConfigPassword(password: string) {
  const configPassword = getConfigPassword();

  return Boolean(configPassword) && safeEqual(password, configPassword);
}

export function isConfigAuthenticated(cookieHeader?: string) {
  const token = getAuthToken();

  if (!token) {
    return false;
  }

  const cookies = parseCookies(cookieHeader);
  const cookieToken = cookies[CONFIG_AUTH_COOKIE];

  return Boolean(cookieToken) && safeEqual(cookieToken, token);
}

export function createConfigAuthCookie() {
  const token = encodeURIComponent(getAuthToken());
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';

  return `${CONFIG_AUTH_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=2592000; SameSite=Lax${secure}`;
}
