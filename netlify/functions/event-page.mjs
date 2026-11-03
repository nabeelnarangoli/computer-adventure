// Netlify Function: shareable event pages at /events/<slug> (with link-preview tags), participant badges at /badge/<token>,
// and the SEO files (sitemap.xml, robots.txt, Google verification file).
import { getStore } from '@netlify/blobs';
import { createHandler } from '../lib/handler.mjs';

const readEnv = (k) => (globalThis.Netlify?.env?.get?.(k)) ?? process.env[k];
const handler = createHandler({
  getStore: (name) => getStore({ name, consistency: 'strong' }),
  env: () => ({ ADMIN_PASSWORD: readEnv('ADMIN_PASSWORD'), SESSION_SECRET: readEnv('SESSION_SECRET'), GSC_SERVICE_ACCOUNT: readEnv('GSC_SERVICE_ACCOUNT'), GSC_SITE_URL: readEnv('GSC_SITE_URL'), ANTHROPIC_API_KEY: readEnv('ANTHROPIC_API_KEY'), ANTHROPIC_MODEL: readEnv('ANTHROPIC_MODEL') }),
});
export default async (req) => handler(req);
// also the SEO files: /sitemap.xml (lists every published event), /robots.txt and Google's verification file
export const config = { path: ['/events/*', '/badge/*', '/sitemap.xml', '/robots.txt', '/google*'] };
