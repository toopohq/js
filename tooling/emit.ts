import { spawnSync } from 'node:child_process'
import { hash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'
import type { ServedRecord } from '@toopo/spec/record'
import { folders, functions } from './folders.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const biome = `${root}node_modules/@biomejs/biome/bin/biome`

// Types erased to whitespace, then formatted: the .js keeps the header, comments and blank lines.
// One Biome per function, about 335 ms warm, so about 35 s for 100 functions; past that, one
// `biome format` over the whole stripped tree.
function strip(source: string): string {
  const run = spawnSync(process.execPath, [biome, 'format', '--stdin-file-path=index.js'], {
    cwd: root,
    input: stripTypeScriptTypes(source),
    encoding: 'utf8',
  })
  if (run.status !== 0) throw run.error ?? new Error(`biome format: ${run.stderr || run.signal}`)
  return run.stdout
}

// A function folder as the files the registry serves, by their path from its root.
export async function emit(name: string): Promise<Map<string, string>> {
  const folder = new URL(`${name}/`, functions)
  const meta: { version: string; summary: string } = await import(new URL('meta.ts', folder).href)
  const index = new URL('index.ts', folder)
  const ts = readFileSync(index, 'utf8')
  const js = strip(ts)
  const address = `js/${name}`
  const record: ServedRecord = {
    address,
    version: meta.version,
    summary: meta.summary,
    // A type leaves no key. Sorted: Node sorts a module's keys, Vitest's runner keeps source order.
    exports: Object.keys(await import(index.href)).sort(),
    emissions: {
      ts: { path: `${address}.ts`, sha256: hash('sha256', ts) },
      js: { path: `${address}.js`, sha256: hash('sha256', js) },
    },
    dependencies: [],
  }
  return new Map([
    [`${address}.json`, `${JSON.stringify(record, null, 2)}\n`],
    [`${address}.ts`, ts],
    [`${address}.js`, js],
  ])
}

if (import.meta.main) {
  const dist = new URL('../dist/', import.meta.url)
  rmSync(dist, { recursive: true, force: true })
  for (const name of folders)
    for (const [path, text] of await emit(name)) {
      const file = new URL(path, dist)
      mkdirSync(new URL('./', file), { recursive: true })
      writeFileSync(file, text)
    }
  // Pages redirects even over an asset, and a placeholder matches a dot: one static rule each.
  // Pages takes 2,000 static rules, so 2,000 functions; past that, a Worker.
  const rules = folders.map((name) => `/js/${name} /js/${name}.json 200\n`)
  writeFileSync(new URL('_redirects', dist), rules.join(''))
  // Pages serves .ts as video/mp2t and names no charset, which a browser needs to show `…`.
  const headers = `/js/*.ts
  Content-Type: text/plain; charset=utf-8
/js/*.js
  Content-Type: text/javascript; charset=utf-8
`
  writeFileSync(new URL('_headers', dist), headers)
}
