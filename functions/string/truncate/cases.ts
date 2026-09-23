import type { truncate } from './index.ts'

type Case =
  | { input: Parameters<typeof truncate>; output: string; throws?: never }
  | { input: Parameters<typeof truncate>; throws: Error; output?: never }

const invalidLength = new RangeError('length must be a non-negative integer or Infinity')

// The name of a case is the reason it exists; a duplicate name does not compile.
export const cases: Record<string, Case> = {
  'a text within the limit comes back unchanged': { input: ['hello', 10], output: 'hello' },
  'a text exactly at the limit comes back unchanged, without omission': {
    input: ['hello', 5],
    output: 'hello',
  },
  'a text within the limit comes back unchanged, even under an omission longer than the limit': {
    input: ['hi', 2, '...'],
    output: 'hi',
  },
  'an empty text comes back empty': { input: ['', 0], output: '' },
  'an infinite length never cuts': { input: ['hello', Infinity], output: 'hello' },

  'the omission counts toward the limit': { input: ['hello world', 8], output: 'hello w…' },
  'one unit over the limit is enough to cut': { input: ['hello', 4], output: 'hel…' },
  'a custom omission replaces the ellipsis': {
    input: ['hello world', 8, '...'],
    output: 'hello...',
  },
  'an empty omission cuts bare': { input: ['hello world', 5, ''], output: 'hello' },
  'a limit the omission fills alone yields the omission alone': {
    input: ['hello', 1],
    output: '…',
  },
  'a cut under an omission longer than the limit yields an empty string': {
    input: ['hello', 2, '...'],
    output: '',
  },
  'a zero length yields an empty string': { input: ['hello', 0], output: '' },

  'the length counts UTF-16 code units, so an emoji weighs two': {
    input: ['😀', 1],
    output: '…',
  },
  'a cut never splits a surrogate pair': { input: ['ab😀cd', 4], output: 'ab…' },
  'a surrogate pair that fits whole is kept': { input: ['ab😀cd', 5], output: 'ab😀…' },
  'a bare cut never splits a surrogate pair either': { input: ['a😀', 2, ''], output: 'a' },
  'a lone high surrogate at the cut is dropped like a pair': {
    input: ['ab\uD800cd', 4],
    output: 'ab…',
  },
  'a lone low surrogate at the cut is kept: only a high one can open a pair': {
    input: ['ab\uDC00cd', 4],
    output: 'ab\uDC00…',
  },
  'a combining accent may be cut from its letter: code units, not graphemes': {
    input: ['café au lait', 5],
    output: 'cafe…',
  },

  'a negative length is a RangeError': { input: ['hello', -1], throws: invalidLength },
  'a negative infinite length is a RangeError': {
    input: ['hello', -Infinity],
    throws: invalidLength,
  },
  'a NaN length is a RangeError': { input: ['hello', Number.NaN], throws: invalidLength },
  'a fractional length is a RangeError': { input: ['hello', 2.5], throws: invalidLength },
  'an invalid length is refused even when the text would fit': {
    input: ['hello', 10.5],
    throws: invalidLength,
  },
}
