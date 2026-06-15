# SMS Web (NodeCampus)

Monorepo for the NodeCampus web frontends.

## Structure

```
apps/
  admin/      # Admin / super-admin dashboard (Next.js)  — port 3000
  student/    # Student dashboard (Next.js)              — port 3001
packages/
  ui/         # Shared NodeCampus design system & components
  api-client/ # Shared typed API client (backend contract)
  types/      # Shared data models / types
```

The mobile app (`sms-mobile`, Expo/React Native) and backend (`sms-backend`) live
in their own repos. They are decoupled from this monorepo — coupling is only via the
backend HTTP API.

## Commands

```bash
npm install            # install all workspaces
npm run dev            # run all apps
npm run dev:admin      # admin only  (http://localhost:3000)
npm run dev:student    # student only (http://localhost:3001)
npm run build          # build all apps
npm run lint           # lint all apps
```

## Tooling

npm workspaces + [Turborepo](https://turbo.build/).
