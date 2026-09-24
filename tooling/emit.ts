import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'
import { fileURLToPath } from 'node:url'
import { folders, functions } from './folders.ts'

const root = fileURLToPath(new URL('../', import.meta.url))
const biome = `${root}node_modules/@biomejs/biome/bin/biome`

// Types erased to whitespace, then formatted: the .js keeps the header, comments and blank lines.
function strip(source: string): string {
  const format = [biome, 'format', '--stdin-file-path=index.js']
  const run = spawnSync(process.execPath, format, {
    cwd: root,
    input: stripTypeScriptTypes(source),
    encoding: 'utf8',
  })
  if (run.status !== 0) throw new Error(run.stderr)
  return run.stdout
}

const sha256 = (text: string) => createHash('sha256').update(text).digest('hex')

// A function folder as the files the registry serves, by their path from its root.
export async function emit(name: string): Promise<Map<string, string>> {
  const folder = new URL(`${name}/`, functions)
  const meta: { version: string; summary: string } = await import(new URL('meta.ts', folder).href)
  const ts = readFileSync(new URL('index.ts', folder), 'utf8')
  const js = strip(ts)
  const address = `js/${name}`
  const record = {
    address,
    version: meta.version,
    summary: meta.summary,
    emissions: {
      ts: { path: `${address}.ts`, sha256: sha256(ts) },
      js: { path: `${address}.js`, sha256: sha256(js) },
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
}
