// js/string/truncate
export function truncate(text: string, length: number, omission = '…'): string {
  if (!(length >= 0 && (Number.isInteger(length) || length === Infinity))) {
    throw new RangeError('length must be a non-negative integer or Infinity')
  }
  if (text.length <= length) return text
  let cut = length - omission.length
  if (cut < 0) return ''
  const unit = text.charCodeAt(cut - 1)
  if (unit >= 0xd800 && unit <= 0xdbff) cut--
  return text.slice(0, cut) + omission
}

