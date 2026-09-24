import { hash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { emit } from './emit.ts'
import { folders, functions } from './folders.ts'

type Fn = (...args: unknown[]) => unknown

// What a call returns or throws, so the .js and index.ts compare on both.
function outcome(fn: Fn | undefined, input: unknown[]): unknown {
  try {
    return fn?.(...input)
  } catch (error) {
    return error
  }
}

// The .js is what a JavaScript project receives, so it does what index.ts does on every input.
test.for(folders)('%s emits index.ts, its .js and their record', async (name) => {
  const tree = await emit(name)
  const index = new URL(`${name}/index.ts`, functions)
  const ts: Record<string, Fn> = await import(index.href)
  const source = encodeURIComponent(tree.get(`js/${name}.js`) ?? '')
  const js: Record<string, Fn> = await import(`data:text/javascript,${source}`)
  const { cases } = await import(new URL(`${name}/cases.ts`, functions).href)
  expect(Object.keys(js)).toEqual(Object.keys(ts))
  for (const key of Object.keys(ts))
    for (const { input } of Object.values<{ input: unknown[] }>(cases))
      expect(outcome(js[key], input)).toEqual(outcome(ts[key], input))
  expect(tree.get(`js/${name}.ts`)).toBe(readFileSync(index, 'utf8'))
  const record = JSON.parse(tree.get(`js/${name}.json`) ?? '')
  expect(record.version).toMatch(/^\d+\.\d+\.\d+$/)
  expect(record.summary).toMatch(/^[A-Z][^.!?]*\.$/)
  for (const { path, sha256 } of Object.values<{ path: string; sha256: string }>(record.emissions))
    expect(hash('sha256', tree.get(path) ?? '')).toBe(sha256)
})
