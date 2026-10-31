export const SUPABASE_URL_ENV = 'VITE_SUPABASE_URL';
export const SUPABASE_KEY_ENV = 'VITE_SUPABASE_KEY';

export const SUPABASE_ADMIN_KEY_MESSAGE =
  'Refusing to start: VITE_SUPABASE_KEY is a Supabase admin key (a service_role JWT or a key that starts with sb_secret_). Set VITE_SUPABASE_KEY to the publishable key (sb_publishable_…) and rebuild.';

export const SUPABASE_MISSING_ENV_MESSAGE =
  'The Supabase environment variables are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_KEY (the publishable key), then rebuild.';

export function normalizeSupabaseKey(key) {
  if (typeof key !== 'string') return '';
  let value = key.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

function decodeBase64Url(segment) {
  const padLength = (4 - (segment.length % 4)) % 4;
  const base64 = segment.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLength);
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

/**
 * @returns {'secret' | 'service_role' | null}
 * `null` means this value is not an admin key. Empty values are not a refusal;
 * the caller reports those as missing configuration.
 */
export function refusalReasonForSupabaseKey(key) {
  const normalized = normalizeSupabaseKey(key);
  if (!normalized) return null;
  if (normalized.startsWith('sb_secret_')) return 'secret';

  const parts = normalized.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) return null;

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1]));
    if (payload && typeof payload === 'object' && payload.role === 'service_role') {
      return 'service_role';
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Returns the URL and key to pass to the browser client.
 * On refusal the key is dropped so callers cannot create a client with it.
 */
export function resolveSupabaseConfig(url, key) {
  const normalizedUrl = typeof url === 'string' ? url.trim() : '';
  const normalizedKey = normalizeSupabaseKey(key);
  const refusal = refusalReasonForSupabaseKey(normalizedKey);

  if (refusal) {
    return {
      url: '',
      key: '',
      error: SUPABASE_ADMIN_KEY_MESSAGE,
      refusal,
    };
  }

  if (!normalizedUrl || !normalizedKey) {
    return {
      url: '',
      key: '',
      error: SUPABASE_MISSING_ENV_MESSAGE,
      refusal: null,
    };
  }

  return {
    url: normalizedUrl,
    key: normalizedKey,
    error: null,
    refusal: null,
  };
}
