import { globSync, readdirSync, readFileSync } from 'node:fs'
import { sep } from 'node:path'
import { expect, test } from 'vitest'

// A user copies index.ts alone, so it must stand alone and hide nothing from the checks here.
const functions = new URL('../functions/', import.meta.url)
const folders = globSync('*/*', { cwd: functions }).map((path) => path.replaceAll(sep, '/'))
const files = [
  'bench.json',
  'cases.bench.ts',
  'cases.test.ts',
  'cases.ts',
  'index.ts',
  'properties.test.ts',
]
const read = (name: string) => readFileSync(new URL(`${name}/index.ts`, functions), 'utf8')

test('every function folder holds exactly its files', () => {
  const entries = (name: string) =>
    readdirSync(new URL(`${name}/`, functions))
      .sort()
      .join()
  const odd = folders.filter((name) => entries(name) !== files.join())
  expect(odd, `a function folder holds ${files.join(', ')}`).toEqual([])
})

test('every delivered file opens on its address', () => {
  expect(folders.filter((name) => !read(name).startsWith(`// js/${name}\n`))).toEqual([])
})

// ponytail: a regex over the text, since TypeScript 7 has no JS API to parse with. It refuses the
// word in a comment or a string too, and misses a computed `globalThis['req' + 'uire']`.
test('every delivered file imports nothing and escapes no check', () => {
  const outside = /\bimport\b|\brequire\b|\bfrom\s*['"]|^\s*\/\/\/|@ts-/m
  expect(folders.filter((name) => outside.test(read(name)))).toEqual([])
})

test('every delivered file is under 10 % comment, its address aside', () => {
  const dense = folders.filter((name) => {
    const lines = read(name)
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
    const comments = lines.filter((line) => /^(\/\/|\/\*|\*)/.test(line))
    return comments.length * 10 >= lines.length
  })
  expect(dense).toEqual([])
})
