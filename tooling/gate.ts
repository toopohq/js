import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { type Bench, expect } from 'vitest'

// Thirty runs with the same code on both sides came within 9.9 %; past 11 % the branch is slower.
const noise = 1.11

function digest(folder: URL): string {
  return createHash('sha256')
    .update(readFileSync(new URL('index.ts', folder)))
    .digest('hex')
}

// A figure is fresh when it carries the digest of the index.ts beside it.
export function fresh(folder: URL): boolean {
  const figure = new URL('bench.json', folder)
  return existsSync(figure) && JSON.parse(readFileSync(figure, 'utf8')).sha256 === digest(folder)
}

// The version on main, imported from a copy; undefined for a function main does not have yet.
async function previous<F>(folder: URL, name: string): Promise<F | undefined> {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: fileURLToPath(folder), encoding: 'utf8' })
  if (!git('ls-tree', '--name-only', 'origin/main', '--', 'index.ts')) return undefined
  const copy = mkdtempSync(join(tmpdir(), 'toopo-'))
  try {
    writeFileSync(join(copy, 'index.ts'), git('show', 'origin/main:./index.ts'))
    return (await import(pathToFileURL(join(copy, 'index.ts')).href))[name]
  } finally {
    rmSync(copy, { recursive: true })
  }
}

function median(values: number[]): number {
  return values.toSorted((a, b) => a - b)[values.length >> 1] as number
}

// Main and the branch are timed in the same run, so the machine, its power and Node cancel out;
// in five rounds, the order alternating, so a disturbance or the second slot favours neither side.
export async function gate<F extends (...args: never) => unknown>(
  bench: Bench,
  at: string,
  current: F,
  calls: number,
  load: (fn: F) => () => unknown,
): Promise<void> {
  const folder = new URL('./', at)
  const main = await previous<F>(folder, current.name)
  const [before, after] = [main ? load(main) : undefined, load(current)]
  const [p50s, ratios]: [number[], number[]] = [[], []]
  for (let round = 0; round < 5; round++) {
    if (!before) {
      p50s.push((await bench('branch', after).run()).latency.p50)
      continue
    }
    const pair = [bench('main', before), bench('branch', after)]
    const result = await bench.compare(...(round % 2 ? pair.reverse() : pair))
    p50s.push(result.get('branch').latency.p50)
    ratios.push(result.get('branch').latency.p50 / result.get('main').latency.p50)
  }
  if (before) expect(median(ratios), 'slower than main beyond the noise').toBeLessThanOrEqual(noise)
  if (fresh(folder)) return
  // The median per call, in nanoseconds: it holds when the case table grows.
  const figure = { sha256: digest(folder), p50: Number(((median(p50s) * 1e6) / calls).toFixed(1)) }
  writeFileSync(new URL('bench.json', folder), `${JSON.stringify(figure, null, 2)}\n`)
}
