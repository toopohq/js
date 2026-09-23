# Contributing

- **A new function** needs its name claimed in [`toopohq/spec`](https://github.com/toopohq/spec)
  first. Open an issue there, naming what the function does.
- **A runtime dependency** is not accepted. A delivered file depends on nothing.

## Before a pull request

```sh
pnpm install
pnpm check
```

- The title follows [Conventional Commits](https://www.conventionalcommits.org), for example
  `feat(string/truncate): the named case table`. It becomes the commit on `main`.
- Every commit is signed off (`git commit -s`), certifying the
  [Developer Certificate of Origin](https://developercertificate.org).
- No assistant attribution in the title, the body or any commit.

CI refuses a pull request that breaks any of these.
