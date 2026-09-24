import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { emit } from './emit.ts'
import { folders, functions } from './folders.ts'

type Fn = (...args: unknown[]) => unknown
type Case = { input: unknown[]; output?: unknown; throws?: Error }

// The .js is what a JavaScript project receives, so it answers to the case table like index.ts.
test.for(folders)('%s emits a .js that passes its case table', async (name) => {
  const js = (await emit(name)).get(`js/${name}.js`) ?? ''
  const module: Record<string, Fn> = await import(`data:text/javascript,${encodeURIComponent(js)}`)
  const cases: Record<string, Case> = (await import(new URL(`${name}/cases.ts`, functions).href))
    .cases
  for (const fn of Object.values(module))
    for (const c of Object.values(cases)) {
      if (c.throws) expect(() => fn(...c.input)).toThrow(c.throws)
      else expect(fn(...c.input)).toBe(c.output)
    }
})

test.for(folders)('%s emits index.ts as it is, and a record of what it serves', async (name) => {
  const tree = await emit(name)
  const record = JSON.parse(tree.get(`js/${name}.json`) ?? '')
  expect(tree.get(`js/${name}.ts`)).toBe(
    readFileSync(new URL(`${name}/index.ts`, functions), 'utf8'),
  )
  expect(record.version).toMatch(/^\d+\.\d+\.\d+$/)
  expect(record.summary).toMatch(/^[A-Z][^.!?]*\.$/)
  for (const { path, sha256 } of Object.values<{ path: string; sha256: string }>(record.emissions))
    expect(
      createHash('sha256')
        .update(tree.get(path) ?? '')
        .digest('hex'),
    ).toBe(sha256)
})
