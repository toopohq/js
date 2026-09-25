import { expect, test } from 'vitest'
import { folders, functions } from './folders.ts'
import { fresh } from './gate.ts'

// No benchmark runs in CI, so CI checks every index.ts carries the digest the gate records on a pass.
test('every function folder holds a receipt of its current code', () => {
  const stale = folders.filter((name) => !fresh(new URL(`${name}/`, functions)))
  expect(stale, 'pnpm bench records the receipt of a changed index.ts').toEqual([])
})
