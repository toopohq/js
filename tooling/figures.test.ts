import { globSync } from 'node:fs'
import { sep } from 'node:path'
import { expect, test } from 'vitest'
import { fresh } from './gate.ts'

// No benchmark runs in CI, so CI checks that every figure was measured on the index.ts beside it.
test('every function folder holds a figure of its current code', () => {
  const functions = new URL('../functions/', import.meta.url)
  const folders = globSync('*/*', { cwd: functions }).map((path) => path.replaceAll(sep, '/'))
  const stale = folders.filter((name) => !fresh(new URL(`${name}/`, functions)))
  expect(stale, 'pnpm bench records the figure of a changed index.ts').toEqual([])
})
