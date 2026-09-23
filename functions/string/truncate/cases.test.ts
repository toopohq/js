import { expect, test } from 'vitest'
import { cases } from './cases.ts'
import { truncate } from './index.ts'

test.for(Object.entries(cases))('%s', ([, c]) => {
  if ('throws' in c) expect(() => truncate(...c.input)).toThrow(c.throws)
  else expect(truncate(...c.input)).toBe(c.output)
})
