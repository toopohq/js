# Contributing

- **A new function** needs its name claimed in [`toopohq/spec`](https://github.com/toopohq/spec)
  first. Open an issue there, naming what the function does.
- **A runtime dependency** is not accepted. A delivered file depends on nothing.
- **Everything under `functions/`** is contributed as MIT-0
  ([`functions/LICENSE`](functions/LICENSE)), so a copied function owes no attribution; the rest of
  the repository is MIT.

## Before a pull request

```sh
pnpm install
pnpm check
```

- A changed `index.ts` needs `pnpm bench`: it times the function against its version on `main` and
  records the figure in `bench.json`, which `pnpm check` requires.
- The title follows [Conventional Commits](https://www.conventionalcommits.org), for example
  `feat(string/truncate): the named case table`. It becomes the commit on `main`.
- Every commit is signed off (`git commit -s`), certifying the
  [Developer Certificate of Origin](https://developercertificate.org).
- No assistant attribution in the title, the body or any commit.

CI refuses a pull request that breaks any of these.
