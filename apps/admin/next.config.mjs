import { PHASE_PRODUCTION_BUILD } from 'next/constants.js';

import { assertPublicEnv, BACKEND_URL } from '../../config/next-env-guard.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {};

// NEXT_PUBLIC_* are inlined at build time: a production build missing one
// would ship a bundle pointing at localhost. Fail `next build` instead.
// Only the build phase is checked — `next start` serves the baked bundle.
const PUBLIC_ENV = [
  BACKEND_URL,
  {
    name: 'NEXT_PUBLIC_STUDENT_URL',
    kind: 'url',
    hint: 'the student portal sign-in page, e.g. https://student.nodecampus.online/signin',
  },
  {
    name: 'NEXT_PUBLIC_SYSTEM_URL',
    kind: 'url',
    hint: 'the system console, e.g. https://system.nodecampus.online',
  },
  {
    name: 'NEXT_PUBLIC_PARENT_PORTAL_URL',
    kind: 'url',
    hint: 'the parent portal (admission forms, certificate QR codes), e.g. https://parent.nodecampus.online',
  },
  {
    name: 'NEXT_PUBLIC_ACADEMIC_YEAR_START_MONTH',
    kind: 'month',
    optional: true,
    hint: 'defaults to 4 (April); must equal the backend ACADEMIC_YEAR_START_MONTH',
  },
];

export default function config(phase) {
  if (phase === PHASE_PRODUCTION_BUILD) assertPublicEnv('admin', PUBLIC_ENV);
  return nextConfig;
}
