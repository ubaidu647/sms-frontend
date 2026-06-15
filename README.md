# SMS Workspace (NodeCampus)

Nx monorepo for the NodeCampus **web + mobile** apps. The backend (`sms-backend`)
stays in its own repo — coupling is only via the backend HTTP API.

## Structure

```
apps/
  admin/      @sms/admin    # Admin / super-admin dashboard (Next.js)  → Vercel, port 3000
  student/    @sms/student  # Student dashboard (Next.js)              → Vercel, port 3001
  mobile/     @sms/mobile   # Expo / React Native app                  → EAS Build (Play/App Store)
packages/
  ui/         @sms/ui         # Shared brand tokens & (web) components
  api-client/ @sms/api-client # Shared axios client (backend contract)
  types/      @sms/types      # Shared data models
```

> Web components (`@sms/ui`) cannot be shared with mobile (`<div>` vs `<View>`).
> What web + mobile **do** share: `@sms/api-client`, `@sms/types`, validation, constants.

## Commands (run from repo root)

```bash
npm install              # install every project (one root node_modules)

# web
npm run dev:admin        # admin   → http://localhost:3000
npm run dev:student      # student → http://localhost:3001
npm run dev              # both web apps
npm run build            # build all buildable projects (web)

# mobile
npm run mobile           # expo start (Metro)
npm run mobile:android   # expo run:android

# misc
npm run lint
npm run graph            # nx project dependency graph
```

You can also call Nx directly: `npx nx build @sms/admin`, `npx nx start @sms/mobile`, etc.

## Tooling

npm workspaces (package linking) + [Nx](https://nx.dev) (task running, caching, graph),
package-based — each app keeps its own `package.json` scripts, Nx infers them as targets.

## Deployment

| Project        | Target                         |
|----------------|--------------------------------|
| `@sms/admin`   | Vercel project (Root Dir `apps/admin`)   |
| `@sms/student` | Vercel project (Root Dir `apps/student`) |
| `@sms/mobile`  | Expo EAS Build → Play / App Store        |
| backend        | separate repo / host                     |

## Mobile notes

`apps/mobile/metro.config.js` is configured for the monorepo (watches the root,
resolves hoisted `node_modules`). After `npm install` at the root, run
`npm run mobile` and verify Metro bundles on a device/emulator.
