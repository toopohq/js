import fc from 'fast-check'
import { expect, test } from 'vitest'
import { truncate } from './index.ts'

// Few units, surrogates among them, so a cut often lands on a pair or a lone half.
const unit = fc.constantFrom('a', '😀', '\uD800', '\uDBFF', '\uDC00')
const text = fc.string({ unit, maxLength: 8 })
const omission = fc.string({ unit, maxLength: 2 })
const length = fc.nat(16)
const invalid = fc.oneof(
  fc.integer({ max: -1 }),
  fc.double({ noInteger: true, max: Number.MAX_VALUE }),
)

test('no result exceeds the length', () => {
  fc.assert(
    fc.property(text, length, omission, (t, n, o) => {
      expect(truncate(t, n, o).length).toBeLessThanOrEqual(n)
    }),
  )
})

test('a text within the length comes back unchanged', () => {
  const room = fc.oneof(fc.nat(4), fc.constant(Infinity))
  fc.assert(
    fc.property(text, room, omission, (t, r, o) => {
      expect(truncate(t, t.length + r, o)).toBe(t)
    }),
  )
})

test('a cut keeps a prefix of the text, then the omission', () => {
  fc.assert(
    fc.property(text, length, omission, (t, n, o) => {
      fc.pre(t.length > n && n >= o.length)
      const result = truncate(t, n, o)
      expect(result).toBe(t.slice(0, result.length - o.length) + o)
    }),
  )
})

test('a cut gives up one unit at most, and never splits a surrogate pair', () => {
  fc.assert(
    fc.property(text, length, omission, (t, n, o) => {
      fc.pre(t.length > n && n >= o.length)
      const kept = t.slice(0, truncate(t, n, o).length - o.length)
      expect(kept.length).toBeGreaterThanOrEqual(n - o.length - 1)
      expect([...t].slice(0, [...kept].length).join('')).toBe(kept)
    }),
  )
})

test('a cut the omission does not fit yields an empty string', () => {
  fc.assert(
    fc.property(text, length, omission, (t, n, o) => {
      fc.pre(t.length > n && n < o.length)
      expect(truncate(t, n, o)).toBe('')
    }),
  )
})

test('an invalid length is a RangeError, whatever the text', () => {
  fc.assert(
    fc.property(text, invalid, (t, n) => {
      expect(() => truncate(t, n)).toThrow(RangeError)
    }),
  )
})
