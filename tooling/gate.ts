import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, test } from 'vitest'

// 54 of 55 runs with the same code on both sides came within 2.2 %; past 3 % the branch is slower.
const noise = 1.03

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

const registered = new Set<string>()

// Main and the branch are timed in the same run, so the machine, its power and Node cancel out;
// in five rounds, the order alternating, so a disturbance or the second slot favours neither side.
// Called at the top level of a bench file that exports `load`, its loop over a version.
export function gate<F extends (...args: never) => unknown>(at: string, current: F, calls: number) {
  // Each side's loop comes from the bench file imported again under a query of its own: closures
  // from one site share V8's feedback, so one call site reaching both versions turns megamorphic.
  // Those copies call gate again, under the same `at`, and register nothing.
  if (registered.has(at)) return
  registered.add(at)
  test('the case table against main', async ({ bench }) => {
    const folder = new URL('./', at)
    const main = await previous<F>(folder, current.name)
    const loop = async (side: string, fn: F): Promise<() => unknown> =>
      (await import(`${at}?${side}`)).load(fn)
    const [before, after] = [main && (await loop('main', main)), await loop('branch', current)]
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
    if (before)
      expect(median(ratios), 'slower than main beyond the noise').toBeLessThanOrEqual(noise)
    if (fresh(folder)) return
    // The median per call, in nanoseconds: it holds when the case table grows.
    const p50 = Number(((median(p50s) * 1e6) / calls).toFixed(1))
    writeFileSync(
      new URL('bench.json', folder),
      `${JSON.stringify({ sha256: digest(folder), p50 }, null, 2)}\n`,
    )
  })
}
