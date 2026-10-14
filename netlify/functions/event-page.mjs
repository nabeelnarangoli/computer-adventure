// Netlify Function: shareable event pages at /events/<slug> (with link-preview tags).
import { getStore } from '@netlify/blobs';
import { createHandler } from '../lib/handler.mjs';

const readEnv = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
const handler = createHandler({
  getStore: (name) => getStore({ name, consistency: 'strong' }),
  env: () => ({ ADMIN_PASSWORD: readEnv('ADMIN_PASSWORD'), SESSION_SECRET: readEnv('SESSION_SECRET') }),
});
export default async (req) => handler(req);
export const config = { path: '/events/*' };
