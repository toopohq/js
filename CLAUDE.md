# js

The JavaScript catalogue of Toopo: utility functions a user copies into their project, one file
each, zero dependencies. TypeScript is the source; `.ts` and `.js` are two emissions of it.

## Structure

- `functions/<domain>/<name>/` — one function. `index.ts` is the delivered file; `cases.bench.ts`
  exports `load`, its loop over the case table, and calls the gate; `bench.json` is its
  receipt, the digest of the `index.ts` the gate passed; `meta.ts` holds its version and summary.
- `functions/LICENSE` — MIT-0 for everything under `functions/`; the repository is MIT.
- `tooling/folders.ts` — every function folder as `<domain>/<name>`, for the guards below.
- `tooling/gate.ts` — the benchmark gate: main's `index.ts` against the branch's, then the receipt.
- `tooling/emit.ts` — the emitter: a function folder as the registry serves it, `js/<domain>/<name>`
  `.ts`, `.js` and `.json`, its record.
- `tooling/emit.test.ts` — the guard: the emitted `.js` does what `index.ts` does on every input
  of the case table, `.ts` is `index.ts`, the record's `exports` are the `.js`'s, at least one and
  no `default`, and every emission the record names is in the tree under its digest.
- `tooling/claims.test.ts` — the guard: every function folder is a name claimed in `spec`.
- `tooling/receipts.test.ts` — the guard: every `bench.json` carries the digest of its `index.ts`.
- `tooling/delivered.test.ts` — the guard: a function folder holds exactly its files, and its
  `index.ts` opens on its address, names no licence, imports nothing, escapes no check, states
  its types rather than asserting them, and is under 10 % comment.
- `tsconfig.json` — everything, newest TypeScript and Node types.
- `tsconfig.baseline.json` — the delivered files alone, against the baseline `lib` and no types.
- `stryker.config.json` — mutation testing over every delivered file; one surviving mutant fails.
- `.claude/hook.mjs` — refuses a root entry outside its allowlist, any `CLAUDE.md` past 150 lines
  and a `dependencies` field; formats and lints every file written. It sees Write and Edit, and a
  shell bypasses it, so `--all` refuses the same over every file git lists.
- `.github/deploy/` — wrangler, its whole tree locked, which the deploy job alone installs.
- `DECISIONS.md` — one line per decision.

`spec` (`@toopo/spec`) is a devDependency from GitHub; the lockfile pins its commit, and
`pnpm update @toopo/spec` moves it after a name is claimed there.

## Commands

- `pnpm install`
- `pnpm check` — the hook's `--all`, Biome (a warning fails), `tsc` over both configs, knip,
  Vitest, then Stryker. CI runs the same, plus the pull request checks and the served-version
  guard, a version `toopo.dev` serves keeps its emissions and none goes back, all of which run even
  when `pnpm check` fails. On `main`, a job of its own, which runs no code of this repository,
  then deploys that run's `dist/` to `toopo.dev`. It fails before deploying a commit `main` has
  moved past, and after unless the site serves every file.
- `pnpm bench` — locally, never in CI. Times each function against its version on `origin/main`,
  five rounds in one run, and fails past 3 %; a changed `index.ts` that passes gets its receipt.
- `pnpm emit` — writes the served tree of the whole catalogue to `dist/`, gitignored, with
  `_redirects`, which serves each record at its address, and `_headers`, the content types.

## Non-negotiables

- Zero runtime dependencies: `pnpm check` refuses a `dependencies` field.
- A function folder is a name claimed in `spec`. Claim it there first.
- A source file is at most 150 lines, a function at most 40. Biome enforces both.
- A pull request touches at most one function folder. CI refuses otherwise.
- A pull request title is a Conventional Commit, every commit is signed off (DCO), and no title,
  body or commit carries assistant attribution. CI refuses otherwise.
- `main` takes squash merges of green pull requests, nothing else.
