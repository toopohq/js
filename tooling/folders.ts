import { globSync } from 'node:fs'
import { sep } from 'node:path'

// Every function folder as `<domain>/<name>`, under the URL of functions/, for the guards.
export const functions = new URL('../functions/', import.meta.url)
export const folders = globSync('*/*', { cwd: functions }).map((path) => path.replaceAll(sep, '/'))
