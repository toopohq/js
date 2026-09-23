import { globSync } from 'node:fs'
import { sep } from 'node:path'
import { names } from '@toopo/spec/names'
import { expect, test } from 'vitest'

// A catalogue publishes only the names spec claims, so every function folder is a claimed name.
test('every function folder is a name claimed in spec', () => {
  const functions = new URL('../functions', import.meta.url)
  const folders = globSync('*/*', { cwd: functions }).map((path) => path.replaceAll(sep, '/'))
  expect(folders.filter((name) => !Object.hasOwn(names, name))).toEqual([])
})
