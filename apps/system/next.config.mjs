import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

import { assertPublicEnv, BACKEND_URL } from '../../config/next-env-guard.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {};

// NEXT_PUBLIC_* are inlined at build time: a production build missing one
// would ship a bundle pointing at localhost. Fail `next build` instead.
// Only the build phase is checked — `next start` serves the baked bundle.
export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) assertPublicEnv('system', [BACKEND_URL]);
  return nextConfig;
}
