# js

The JavaScript catalogue of Toopo: utility functions a user copies into their project, one file
each, zero dependencies. TypeScript is the source; `.ts` and `.js` are two emissions of it.

## Structure

- `functions/<domain>/<name>/` — one function. `index.ts` is the delivered file.
- `tooling/claims.test.ts` — the guard: every function folder is a name claimed in `spec`.
- `tsconfig.json` — everything, newest TypeScript and Node types.
- `tsconfig.baseline.json` — delivered files only, `lib: ["es2023"]`, no Node types: Baseline
  Widely Available. It joins `pnpm check` with the first `index.ts`; tsc refuses an empty program.
- `.claude/hook.mjs` — refuses a root entry outside its allowlist, a `dependencies` field in
  `package.json` and a `CLAUDE.md` past 150 lines; formats and lints every file written.
- `DECISIONS.md` — one line per decision.

`spec` (`@toopo/spec`) is a devDependency from GitHub; the lockfile pins its commit, and
`pnpm update @toopo/spec` moves it after a name is claimed there.

## Commands

- `pnpm install`
- `pnpm check` — Biome, `tsc`, Vitest, knip. CI runs the same, plus the pull request checks.

## Non-negotiables

- Zero runtime dependencies: `package.json` has no `dependencies` field. The hook and CI refuse one.
- A function folder is a name claimed in `spec`. Claim it there first.
- Delivered code compiles against `tsconfig.baseline.json`.
- A source file is at most 150 lines, a function at most 40. Biome enforces both.
- A pull request title is a Conventional Commit, every commit is signed off (DCO), and no title,
  body or commit carries assistant attribution. CI refuses otherwise.
- `main` takes squash merges of green pull requests, nothing else.
