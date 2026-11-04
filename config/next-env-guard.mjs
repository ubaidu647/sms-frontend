/**
 * Build-time guard for NEXT_PUBLIC_* variables, shared by every app's
 * next.config.mjs.
 *
 * NEXT_PUBLIC_* values are inlined into the client bundle when `next build`
 * runs — setting them later on the server changes nothing. The source keeps a
 * localhost fallback so `next dev` works out of the box, which means a
 * production build that forgot a variable would ship a bundle that talks to
 * http://localhost and fail only in users' browsers. This turns that into a
 * failed build with a clear message instead.
 *
 * Escape hatch: ALLOW_LOCALHOST_BUILD=1 downgrades the failure to a warning,
 * for local verification builds that are never deployed.
 */

/** Months are 1–12; anything else silently falls back to April in the apps. */
function checkMonth(raw) {
  const n = Number(raw);
  return Number.isInteger(n) && n >= 1 && n <= 12 ? null : { fatal: 'must be an integer 1–12' };
}

/**
 * Unparseable → fatal. Plain http or a localhost host → a loud warning only:
 * that is an explicit choice someone typed (a local .env.local, a staging
 * box), not the forgotten-variable failure this guard exists for.
 */
function checkUrl(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return { fatal: 'must be an absolute https:// URL' };
  }
  if (!/^https?:$/.test(url.protocol)) return { fatal: 'must be an absolute https:// URL' };
  if (/^(localhost|127\.|0\.0\.0\.0|\[::1\])/.test(url.hostname)) {
    return { warn: 'points at localhost — fine for a local build, never for a deployed one' };
  }
  if (url.protocol !== 'https:') {
    return { warn: 'is plain http:// — Secure session cookies will not work over it' };
  }
  return null;
}

const CHECKS = { url: checkUrl, month: checkMonth };

/**
 * @param {{ name: string, kind: 'url' | 'month', hint: string, optional?: boolean }[]} vars
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {{ fatal: string[], warn: string[] }}
 */
export function findPublicEnvProblems(vars, env = process.env) {
  const fatal = [];
  const warn = [];
  for (const { name, kind, hint, optional } of vars) {
    const raw = env[name]?.trim();
    if (!raw) {
      if (!optional) fatal.push(`  • ${name} is not set\n    → ${hint}`);
      continue;
    }
    const result = CHECKS[kind](raw);
    if (result?.fatal) fatal.push(`  • ${name} ${result.fatal}\n    → ${hint}`);
    else if (result?.warn) warn.push(`  • ${name} ${result.warn}`);
  }
  return { fatal, warn };
}

/**
 * Throw (failing `next build`) when a required variable is missing or invalid,
 * unless ALLOW_LOCALHOST_BUILD=1.
 */
export function assertPublicEnv(app, vars, env = process.env) {
  const { fatal, warn } = findPublicEnvProblems(vars, env);
  // next build loads the config in several worker processes; they inherit this
  // flag, so the warnings print once rather than once per worker.
  const quiet = process.env.NEXT_ENV_GUARD_WARNED === '1';
  process.env.NEXT_ENV_GUARD_WARNED = '1';
  if (warn.length && !quiet) {
    console.warn(`\n⚠ [${app}] production build with non-production URLs:\n${warn.join('\n')}\n`);
  }
  if (fatal.length === 0) return;

  const header =
    `[${app}] production build: ${fatal.length} NEXT_PUBLIC_* problem` +
    `${fatal.length === 1 ? '' : 's'}. These are inlined into the bundle at build time.`;
  const body = `${header}\n\n${fatal.join('\n')}\n\nSee apps/${app}/.env.example.`;

  if (env.ALLOW_LOCALHOST_BUILD === '1' || env.ALLOW_LOCALHOST_BUILD === 'true') {
    if (quiet) return;
    console.warn(
      `\n⚠ ${body}\nALLOW_LOCALHOST_BUILD is set: continuing with localhost fallbacks. ` +
        'Do NOT deploy this build.\n',
    );
    return;
  }
  throw new Error(
    `${body}\nSet them (or ALLOW_LOCALHOST_BUILD=1 for a local, never-deployed build).`,
  );
}

/** The backend API base URL, used by every app. */
export const BACKEND_URL = {
  name: 'NEXT_PUBLIC_BACKEND_URL',
  kind: 'url',
  hint: 'the API base including /api, e.g. https://api.nodecampus.online/api',
};
