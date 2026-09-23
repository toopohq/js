import type { truncate } from './index.ts'

type Case =
  | { input: Parameters<typeof truncate>; output: string }
  | { input: Parameters<typeof truncate>; throws: ErrorConstructor }

// The name of a case is the reason it exists; a duplicate name does not compile.
export const cases: Readonly<Record<string, Case>> = {
  'a text within the limit comes back unchanged': { input: ['hello', 10], output: 'hello' },
  'a text exactly at the limit comes back unchanged, without omission': {
    input: ['hello', 5],
    output: 'hello',
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
  'an omission longer than the limit is dropped and the text cut bare': {
    input: ['hello', 2, '...'],
    output: 'he',
  },
  'a zero length yields an empty string': { input: ['hello', 0], output: '' },

  'the length counts UTF-16 code units, so an emoji weighs two': {
    input: ['😀', 2],
    output: '😀',
  },
  'a cut never splits a surrogate pair': { input: ['ab😀cd', 4], output: 'ab…' },
  'a surrogate pair that fits whole is kept': { input: ['ab😀cd', 5], output: 'ab😀…' },
  'a bare cut never splits a surrogate pair either': { input: ['a😀', 2, '...'], output: 'a' },
  'a combining accent may be cut from its letter: code units, not graphemes': {
    input: ['café au lait', 5],
    output: 'cafe…',
  },

  'a negative length is a RangeError': { input: ['hello', -1], throws: RangeError },
  'a NaN length is a RangeError': { input: ['hello', Number.NaN], throws: RangeError },
  'a fractional length is a RangeError': { input: ['hello', 2.5], throws: RangeError },
  'an invalid length is refused even when the text would fit': {
    input: ['', -1],
    throws: RangeError,
  },
}
