import { expect, test } from 'vitest'
import { type Case, cases } from './cases.ts'
import { truncate } from './index.ts'

test.for(Object.entries<Case>(cases))('%s', ([, c]) => {
  if (c.throws) expect(() => truncate(...c.input)).toThrow(c.throws)
  else expect(truncate(...c.input)).toBe(c.output)
})
