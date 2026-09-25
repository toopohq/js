import { expect, test } from 'vitest'
import { folders, functions } from './folders.ts'
import { fresh } from './gate.ts'

// No benchmark runs in CI, so CI checks that the gate passed on every index.ts it holds.
test('every function folder holds a receipt of its current code', () => {
  const stale = folders.filter((name) => !fresh(new URL(`${name}/`, functions)))
  expect(stale, 'pnpm bench records the receipt of a changed index.ts').toEqual([])
})
