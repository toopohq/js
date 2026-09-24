import { readdirSync, readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { expect, test } from 'vitest'
import { folders, functions } from './folders.ts'

// A user copies index.ts alone, so it must stand alone and hide nothing from the checks here.
const files = 'bench.json,cases.bench.ts,cases.test.ts,cases.ts,index.ts,meta.ts,properties.test.ts'
const read = (name: string) => readFileSync(new URL(`${name}/index.ts`, functions), 'utf8')

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
    const body = read(name)
      .replace(/\/\*[\s\S]*?\*\//g, (block) => block.replace(/^/gm, '//'))
      .split('\n')
      .slice(1)
      .map((line) => line.trim())
      .filter(Boolean)
    return body.filter((line) => line.startsWith('//')).length * 10 >= body.length
  })
  expect(dense).toEqual([])
})

// Node's stripper blanks type syntax in place, so an `as` it blanks is an assertion and one in a
// comment or a string is not. Biome refuses `any` and `!`; `tsc` refuses `<T>x`.
test('every delivered file states its types rather than asserting them', () => {
  const asserts = (text: string) => {
    const js = stripTypeScriptTypes(text)
    return [...text.matchAll(/\bas\b/g)].some(({ index }) => js[index] === ' ')
  }
  expect(folders.filter((name) => asserts(read(name)))).toEqual([])
})
