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

// The index.ts of origin/main, or undefined for a function main does not have yet.
function previous(folder: URL): string | undefined {
  const git = (...args: string[]) =>
    execFileSync('git', args, { cwd: fileURLToPath(folder), encoding: 'utf8' })
  return git('ls-tree', '--name-only', 'origin/main', '--', 'index.ts')
    ? git('show', 'origin/main:./index.ts')
    : undefined
}

// A version imported from a copy of its source, in a folder of its own: a new module, compiled anew.
async function compiled(source: string, name: string): Promise<unknown> {
  const copy = mkdtempSync(join(tmpdir(), 'toopo-'))
  try {
    writeFileSync(join(copy, 'index.ts'), source)
    return (await import(pathToFileURL(join(copy, 'index.ts')).href))[name]
  } finally {
    rmSync(copy, { recursive: true })
  }
}

function median(values: number[]): number {
  return values.toSorted((a, b) => a - b)[values.length >> 1] as number
}

// Main and the branch are timed in the same run, so the machine, its power and Node cancel out;
// in five rounds, the order alternating, so a disturbance or the second slot favours neither side;
// each round compiling both sides anew, so a compilation that lands slow weighs one round of five.
// Called at the top level of a bench file, with `load`, its loop over a version, exported too.
export function gate<F extends (...args: never) => unknown>(
  at: string,
  current: F,
  load: (fn: F) => () => unknown,
) {
  // A side's loop comes from the bench file imported again under a query of its own: closures
  // from one site share V8's feedback, so one loop reaching two versions turns megamorphic. Those
  // copies are evaluated inside the running test, so their own call here registers nothing.
  if (TestRunner.getCurrentTest()) return
  test('the case table against main', async ({ bench }) => {
    const folder = new URL('./', at)
    const main = previous(folder)
    // Nothing to compare: the loop runs once, so a broken `load` fails now rather than later.
    if (main === undefined) await load(current)()
    else {
      const sources = { main, branch: readFileSync(new URL('index.ts', folder), 'utf8') }
      const ratios: number[] = []
      for (let round = 0; round < 5; round++) {
        const pair = []
        for (const [side, source] of Object.entries(sources)) {
          const version = await compiled(source, current.name)
          expect(version, `${side}'s index.ts exports no ${current.name}`).toBeTypeOf('function')
          pair.push(bench(side, (await import(`${at}?${side}${round}`)).load(version)))
        }
        const result = await bench.compare(...(round % 2 ? pair.reverse() : pair))
        ratios.push(result.get('branch').latency.p50 / result.get('main').latency.p50)
      }
      expect(median(ratios), 'slower than main beyond the noise').toBeLessThanOrEqual(noise)
    }
    const receipt = { sha256: digest(folder) }
    writeFileSync(new URL('bench.json', folder), `${JSON.stringify(receipt, null, 2)}\n`)
  })
}
