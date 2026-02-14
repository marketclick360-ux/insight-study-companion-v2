import { z } from 'zod';

export const JwUrlSchema = z
  .string()
  .trim()
  .url('Please enter a valid URL')
  .refine((raw) => {
    try {
      const u = new URL(raw);
      return (
        u.protocol === 'https:' &&
        u.hostname === 'www.jw.org' &&
        u.pathname.length > 1
      );
    } catch {
      return false;
    }
  }, 'Must be an official https://www.jw.org/... link');

export function validateJwUrl(url: string): { valid: boolean; error?: string } {
  const result = JwUrlSchema.safeParse(url);
  if (result.success) return { valid: true };
  return {
    valid: false,
    error: result.error.issues[0]?.message || 'Invalid URL',
  };
}
