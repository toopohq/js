import { createHash } from 'node:crypto'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { expect, test } from 'vitest'
import { cases } from './cases.ts'
import { truncate } from './index.ts'

// The figure holds the digest of the code it measured: CI refuses an index.ts it does not match.
const figure = new URL('bench.json', import.meta.url)
const sha256 = createHash('sha256')
  .update(readFileSync(new URL('index.ts', import.meta.url)))
  .digest('hex')
// Unchanged code measured up to 11 % apart from one run to the next; past 15 % it is slower.
const noise = 1.15
// Vitest reads an import through a getter; one read here keeps it out of the measure.
const cut = truncate

// Every branch once, a throw aside: building an Error would outweigh the call it measures.
const inputs = Object.values(cases).flatMap((c) => (c.throws ? [] : [c.input]))

// A hundred passes, so a 100 ns timer tick weighs under 1 % of an iteration.
test('the case table, a hundred times over', async ({ bench }) => {
  const { latency } = await bench('truncate', () => {
    let units = 0
    for (let i = 0; i < 100; i++) for (const input of inputs) units += cut(...input).length
    return units
  }).run()
  const recorded = existsSync(figure) ? JSON.parse(readFileSync(figure, 'utf8')) : undefined
  if (recorded) expect(latency.p50).toBeLessThanOrEqual(recorded.latency.p50 * noise)
  if (recorded?.sha256 !== sha256)
    writeFileSync(figure, `${JSON.stringify({ sha256, latency }, null, 2)}\n`)
})
