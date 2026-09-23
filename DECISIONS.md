# Decisions

One line per decision, newest last.

- 2026-09-23 — `spec` is a devDependency from GitHub, its commit pinned by the lockfile. Not published to npm: it never runs in a user's project, and a release pipeline would buy nothing.
- 2026-09-23 — `spec` exports raw `.ts`. Vitest and `tsc` read it as it is; a consumer that ships its code bundles it.
- 2026-09-23 — Baseline Widely Available is `lib: ["es2023"]`. ES2024 as a whole is not there yet (resizable `ArrayBuffer`, early 2027); a granular entry such as `es2024.object` is added when a function needs it.
- 2026-09-23 — Delivered files are checked in their own program, `tsconfig.baseline.json`: Vite's types reference Node's, so any program that imports Vitest sees `Buffer` and `setTimeout`.
- 2026-09-23 — TypeScript 7 includes no `@types` package unless named, so `tsconfig.json` names `node`.
- 2026-09-23 — No runtime dependencies: the hook refuses a `dependencies` field on a write, CI refuses it on every pull request, since `pnpm add` in a shell bypasses the hook.
