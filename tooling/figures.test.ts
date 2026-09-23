import { createHash } from 'node:crypto'
import { existsSync, globSync, readFileSync } from 'node:fs'
import { sep } from 'node:path'
import { expect, test } from 'vitest'

// No benchmark runs in CI, so CI checks that every figure was measured on the index.ts beside it.
test('every function folder holds a figure of its current code', () => {
  const functions = new URL('../functions/', import.meta.url)
  const folders = globSync('*/*', { cwd: functions }).map((path) => path.replaceAll(sep, '/'))
  const stale = folders.filter((name) => {
    const code = readFileSync(new URL(`${name}/index.ts`, functions))
    const sha256 = createHash('sha256').update(code).digest('hex')
    const figure = new URL(`${name}/bench.json`, functions)
    return !existsSync(figure) || JSON.parse(readFileSync(figure, 'utf8')).sha256 !== sha256
  })
  expect(stale).toEqual([])
})
