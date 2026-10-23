// Single source of truth for the public site URL.
// Override with the SITE_URL env var (e.g. on Railway) once the real domain is live.
export const DEFAULT_SITE_URL = 'https://web-production-8d417.up.railway.app';
export const SITE_URL = (process.env.SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, '');
