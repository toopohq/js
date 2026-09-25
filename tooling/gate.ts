import { execFileSync } from 'node:child_process'
import { hash } from 'node:crypto'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { expect, TestRunner, test } from 'vitest'

// Same code on both sides: 54 of 55 runs within 2.2 %, on one machine. Past 3 %, the gate fails.
const noise = 1.03

function digest(folder: URL): string {
  return hash('sha256', readFileSync(new URL('index.ts', folder)))
}

// A receipt is fresh when it carries the digest of the index.ts beside it.
export function fresh(folder: URL): boolean {
  const receipt = new URL('bench.json', folder)
  return existsSync(receipt) && JSON.parse(readFileSync(receipt, 'utf8')).sha256 === digest(folder)
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
// Called at the top level of a bench file, with `load`, its loop over a version, exported too.
export function gate<F extends (...args: never) => unknown>(
  at: string,
  current: F,
  load: (fn: F) => () => unknown,
) {
  // Main's loop comes from the bench file imported again under `?main`: closures from one site
  // share V8's feedback, so one call site reaching both versions turns megamorphic. That copy is
  // evaluated inside the running test, so its own call here registers nothing.
  if (TestRunner.getCurrentTest()) return
  test('the case table against main', async ({ bench }) => {
    const folder = new URL('./', at)
    const main = await previous<F>(folder, current.name)
    const before: (() => unknown) | undefined = main && (await import(`${at}?main`)).load(main)
    const after = load(current)
    // Nothing to compare: the loop runs once, so a broken `load` fails now rather than later.
    if (!before) after()
    else {
      const ratios: number[] = []
      for (let round = 0; round < 5; round++) {
        const pair = [bench('main', before), bench('branch', after)]
        const result = await bench.compare(...(round % 2 ? pair.reverse() : pair))
        ratios.push(result.get('branch').latency.p50 / result.get('main').latency.p50)
      }
      expect(median(ratios), 'slower than main beyond the noise').toBeLessThanOrEqual(noise)
    }
    if (fresh(folder)) return
    const receipt = { sha256: digest(folder) }
    writeFileSync(new URL('bench.json', folder), `${JSON.stringify(receipt, null, 2)}\n`)
  })
}
