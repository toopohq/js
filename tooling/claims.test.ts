import { globSync } from 'node:fs'
import { sep } from 'node:path'
import { names } from '@toopo/spec/names'
import { expect, test } from 'vitest'

// A catalogue publishes only the names spec claims, so every function folder is a claimed name.
test('every function folder is a name claimed in spec', () => {
  const folders = globSync('functions/*/*').map((path) => path.split(sep).slice(1).join('/'))
  expect(folders.filter((name) => !Object.hasOwn(names, name))).toEqual([])
})
