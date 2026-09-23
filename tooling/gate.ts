import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { type Bench, expect } from 'vitest'

// Thirty runs with the same code on both sides came within 14.9 %; past 15 % the branch is slower.
const noise = 1.15

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

// Main and the branch are timed in the same run, so the machine, its power and Node cancel out.
export async function gate<F extends (...args: never) => unknown>(
  bench: Bench,
  at: string,
  current: F,
  calls: number,
  load: (fn: F) => () => unknown,
): Promise<void> {
  const folder = new URL('./', at)
  const main = await previous<F>(folder, current.name)
  let p50: number
  if (main) {
    const result = await bench.compare(bench('main', load(main)), bench('branch', load(current)))
    p50 = result.get('branch').latency.p50
    const ceiling = result.get('main').latency.p50 * noise
    expect(p50, 'the branch is slower than main beyond the noise').toBeLessThanOrEqual(ceiling)
  } else p50 = (await bench('branch', load(current)).run()).latency.p50
  if (fresh(folder)) return
  // The median per call, in nanoseconds: it holds when the case table grows.
  const figure = { sha256: digest(folder), p50: Number(((p50 * 1e6) / calls).toFixed(1)) }
  writeFileSync(new URL('bench.json', folder), `${JSON.stringify(figure, null, 2)}\n`)
}
