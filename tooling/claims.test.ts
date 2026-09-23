import { names } from '@toopo/spec/names'
import { expect, test } from 'vitest'
import { folders } from './folders.ts'

// A catalogue publishes only the names spec claims, so every function folder is a claimed name.
test('every function folder is a name claimed in spec', () => {
  expect(folders.filter((name) => !Object.hasOwn(names, name))).toEqual([])
})
