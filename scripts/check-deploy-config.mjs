#!/usr/bin/env node
// Pins the Worker config a deploy publishes from a built site.
//
//   node scripts/check-deploy-config.mjs <site-dir>          check the config, then rewrite the pointer
//   node scripts/check-deploy-config.mjs <site-dir> --write  regenerate scripts/expected-wrangler.json
//
// The Cloudflare Vite plugin writes <site-dir>/dist/rsc/wrangler.json and a pointer to it in
// <site-dir>/.wrangler/deploy/config.json. wrangler follows the pointer, takes the Worker name from
// the config and runs any `build.command` it names with the deploy token in its environment. So
// before a deploy this script refuses unless the config is the plugin's exact compact JSON and,
// minus the build machine's two absolute paths, equals scripts/expected-wrangler.json; then it
// writes the pointer itself. Regenerate the expected copy with --write after a fresh
// `npm run build` whenever @cloudflare/vite-plugin, wrangler or wrangler.jsonc changes.
// Node 22 or later, no dependencies.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'

const EXPECTED = fileURLToPath(new URL('./expected-wrangler.json', import.meta.url))
const POINTER = { configPath: '../../dist/rsc/wrangler.json', auxiliaryWorkers: [] }
const MACHINE_PATHS = ['configPath', 'userConfigPath']

const refuse = (message) => {
  console.error(`check-deploy-config: ${message}`)
  process.exit(1)
}

const [dir, flag, ...rest] = process.argv.slice(2)
if (!dir || rest.length > 0 || (flag !== undefined && flag !== '--write')) {
  console.error('usage: node scripts/check-deploy-config.mjs <site-dir> [--write]')
  process.exit(2)
}

const configFile = path.join(dir, 'dist/rsc/wrangler.json')
const text = fs.readFileSync(configFile, 'utf8')
let config
try {
  config = JSON.parse(text)
} catch {
  refuse(`${configFile} is not JSON`)
}
// The plugin writes JSON.stringify output; anything else (comments, duplicate keys, padding)
// could read differently in wrangler's parser.
if (text !== JSON.stringify(config)) refuse(`${configFile} is not the plugin's compact JSON`)
for (const key of MACHINE_PATHS) delete config[key]

if (flag === '--write') {
  fs.writeFileSync(EXPECTED, `${JSON.stringify(config, null, 2)}\n`)
  console.log(`check-deploy-config: wrote ${path.relative(process.cwd(), EXPECTED)}`)
  process.exit(0)
}

const expected = JSON.parse(fs.readFileSync(EXPECTED, 'utf8'))
if (!isDeepStrictEqual(config, expected)) {
  const keys = [...new Set([...Object.keys(config), ...Object.keys(expected)])]
  const differing = keys.filter((key) => !isDeepStrictEqual(config[key], expected[key]))
  refuse(`${configFile} differs from scripts/expected-wrangler.json in: ${differing.join(', ')}`)
}

const pointerFile = path.join(dir, '.wrangler/deploy/config.json')
fs.mkdirSync(path.dirname(pointerFile), { recursive: true })
fs.rmSync(pointerFile, { force: true })
fs.writeFileSync(pointerFile, JSON.stringify(POINTER))
console.log(`check-deploy-config: ok, ${configFile} matches and the pointer is fixed`)
