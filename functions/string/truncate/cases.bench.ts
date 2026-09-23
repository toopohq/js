import { test } from 'vitest'
import { gate } from '../../../tooling/gate.ts'
import { cases } from './cases.ts'
import { truncate } from './index.ts'

// Every branch once, a throw aside: building an Error would outweigh the call it measures.
const inputs = Object.values(cases).flatMap((c) => (c.throws ? [] : [c.input]))
// In columns, so a call passes its arguments without a spread.
const texts = inputs.map(([text]) => text)
const lengths = inputs.map(([, length]) => length)
const omissions = inputs.map(([, , omission]) => omission)
// A hundred passes, so a 100 ns timer tick weighs under 1 % of an iteration.
const passes = 100

test('the case table, a hundred times over, against main', ({ bench }) =>
  gate(bench, import.meta.url, truncate, passes * inputs.length, (cut) => () => {
    let units = 0
    for (let i = 0; i < passes; i++)
      for (let j = 0; j < inputs.length; j++)
        units += cut(texts[j] as string, lengths[j] as number, omissions[j]).length
    return units
  }))
