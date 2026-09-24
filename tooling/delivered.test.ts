import { readdirSync, readFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { folders, functions } from './folders.ts'

// A user copies index.ts alone, so it must stand alone and hide nothing from the checks here.
const files = 'bench.json,cases.bench.ts,cases.test.ts,cases.ts,index.ts,meta.ts,properties.test.ts'
const read = (name: string) => readFileSync(new URL(`${name}/index.ts`, functions), 'utf8')

// A block comment becomes line comments, so the two checks over shapes below read one form.
const lines = (name: string) =>
  read(name)
    .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/^/gm, '//'))
    .split('\n')
    .map((line) => line.trim())

test('every function folder holds exactly its files', () => {
  const entries = (name: string) =>
    readdirSync(new URL(`${name}/`, functions))
      .sort()
      .join()
  const odd = folders.filter((name) => entries(name) !== files)
  expect(odd, `a function folder holds ${files}`).toEqual([])
})

test('every delivered file opens on its address and names no licence', () => {
  const licence = /copyright|licen[cs]e|spdx/i
  const odd = folders.filter((name) => {
    const text = read(name)
    return !text.startsWith(`// js/${name}\n`) || licence.test(text)
  })
  expect(odd).toEqual([])
})

// A regex over the text, since TypeScript 7 has no JS API to parse with. It refuses the word in a
// comment or a string too, and misses `new Function('return process')()`, which passes tsc and the
// regex alike: a deliberate bypass that only review catches.
test('every delivered file imports nothing and escapes no check', () => {
  const outside =
    /\bimport\b|\brequire\b|\bfrom\s*['"]|^\s*\/\/\/|@ts-|\bdeclare\b|Stryker|biome-ignore/m
  expect(folders.filter((name) => outside.test(read(name)))).toEqual([])
})

// A `/*` inside a string or a regex opens a comment here, so the check errs strict, and a trailing
// comment is not counted.
test('every delivered file is under 10 % comment, its address aside', () => {
  const dense = folders.filter((name) => {
    const body = lines(name).slice(1).filter(Boolean)
    return body.filter((line) => line.startsWith('//')).length * 10 >= body.length
  })
  expect(dense).toEqual([])
})

// The comment lines go first, `as` being a common English word; one inside a string literal still
// counts, erring strict as the check above does. `satisfies` is not here: it checks a type rather
// than asserting one.
test('every delivered file states its types rather than asserting them', () => {
  const asserted = /\bas\b|\bany\b|[\w)\]]!\s*[.,;)\]]/
  const code = (name: string) =>
    lines(name)
      .filter((line) => !line.startsWith('//'))
      .join('\n')
  expect(folders.filter((name) => asserted.test(code(name)))).toEqual([])
})
