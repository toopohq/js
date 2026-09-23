# Decisions

One line per decision, newest last.

- 2026-09-23 — `spec` is a devDependency from GitHub, its commit pinned by the lockfile. Not published to npm: it never runs in a user's project, and a release pipeline would buy nothing.
- 2026-09-23 — `spec` exports raw `.ts`. Vitest and `tsc` read it as it is; a consumer that ships its code bundles it.
- 2026-09-23 — Baseline Widely Available is `lib: ["es2023"]`, and `lib` covers the language only. ES2024 as a whole is not there yet (resizable `ArrayBuffer`, early 2027); a granular entry such as `es2024.object` is added when a function needs it. Host APIs (`setTimeout`, `URL`, `TextEncoder`, `structuredClone`) are decided when a function needs one. `lib` does not track Baseline to the day: `Intl.Segmenter` passes before it becomes Widely Available on 2026-10-16, and that is accepted.
- 2026-09-23 — Delivered files are checked in their own program, `tsconfig.baseline.json`: Vite's types reference Node's, so any program that imports Vitest sees `Buffer` and `process`.
- 2026-09-23 — TypeScript 7 includes no `@types` package unless named, so `tsconfig.json` names `node`.
- 2026-09-23 — No runtime dependencies: the hook refuses a `dependencies` field on a write, CI refuses it on every pull request, since `pnpm add` in a shell bypasses the hook.
- 2026-09-23 — A Biome warning fails like an error, in CI and in the hook (`--error-on-warnings`): a warning that passes is a wish.
- 2026-09-23 — The baseline program sets `target: "es2024"`, so TypeScript's target-gated syntax checks run against the baseline, not `esnext`. The only syntax ES2024 adds, the regex `v` flag, is Widely Available since March 2026; its library is not, so `lib` stays `es2023`.
- 2026-09-23 — `pnpm check` runs Vitest after the static guards, and CI runs its own checks even when `pnpm check` fails: a case table that is red on purpose hides no other guard.
- 2026-09-23 — Stryker runs in `pnpm check`, after Vitest, over every delivered file, and breaks below 100: a surviving mutant is a missing case or code nothing needs. Scoping it to the folders a pull request touches arrives with the second function. Stryker runs the case table alone: `ignorePatterns` keeps the properties out of its sandbox, so no mutant is killed by the luck of a fast-check seed alone. `cleanTempDir` is `always`, because Vitest would collect a sandbox left by a failed run.
- 2026-09-23 — Stryker's `tsconfigFile` is empty: its sandbox rewrite of `extends` and `references` calls TypeScript's JS API, which TypeScript 7 no longer has, and no tsconfig here points outside the repository. `plugins` names the Vitest runner, which pnpm's isolated `node_modules` hides from Stryker's default lookup.
