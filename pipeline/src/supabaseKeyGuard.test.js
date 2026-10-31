import assert from 'node:assert/strict';
import test from 'node:test';
import {
  SUPABASE_ADMIN_KEY_MESSAGE,
  refusalReasonForSupabaseKey,
  resolveSupabaseConfig,
} from './supabaseKeyGuard.js';

function jwt(payload) {
  const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

test('refuses sb_secret_ keys, including surrounding space and quotes', () => {
  assert.equal(refusalReasonForSupabaseKey('sb_secret_example'), 'secret');
  assert.equal(refusalReasonForSupabaseKey('  sb_secret_example  '), 'secret');
  assert.equal(refusalReasonForSupabaseKey('"sb_secret_example"'), 'secret');
});

test('allows the publishable key and an anon JWT', () => {
  assert.equal(refusalReasonForSupabaseKey('sb_publishable_example'), null);
  assert.equal(refusalReasonForSupabaseKey(jwt({ role: 'anon', ref: 'example' })), null);
});

test('refuses a service_role JWT and does not return that key', () => {
  const serviceKey = jwt({ role: 'service_role', ref: 'example' });
  assert.equal(refusalReasonForSupabaseKey(serviceKey), 'service_role');

  const resolved = resolveSupabaseConfig('https://example.supabase.co', serviceKey);
  assert.equal(resolved.refusal, 'service_role');
  assert.equal(resolved.key, '');
  assert.equal(resolved.url, '');
  assert.equal(resolved.error, SUPABASE_ADMIN_KEY_MESSAGE);
  assert.equal(resolved.error.includes(serviceKey), false);
  assert.equal(resolved.error.includes('sb_secret_example'), false);
});

test('treats a missing URL or key as configuration, not as an admin key', () => {
  const resolved = resolveSupabaseConfig('', 'sb_publishable_example');
  assert.equal(resolved.refusal, null);
  assert.equal(resolved.key, '');
  assert.match(resolved.error, /VITE_SUPABASE_URL/);
});

test('passes a publishable key through', () => {
  const resolved = resolveSupabaseConfig(
    ' https://example.supabase.co ',
    ' sb_publishable_example ',
  );
  assert.equal(resolved.error, null);
  assert.equal(resolved.url, 'https://example.supabase.co');
  assert.equal(resolved.key, 'sb_publishable_example');
});

test('ignores strings that merely contain dots', () => {
  assert.equal(refusalReasonForSupabaseKey('not.a.jwt'), null);
  assert.equal(refusalReasonForSupabaseKey(jwt({ role: 'authenticated' })), null);
});
