import fs from 'node:fs'
import path from 'node:path'
import { cloudflare } from '@cloudflare/vite-plugin'
import { holocron } from '@holocron.so/vite'
import { defineConfig, type Plugin } from 'vite'

// The chat gateway Worker. holocron bakes HOLOCRON_URL into the build and sends chat,
// OG images and config overrides there, so every build calls our gateway and never
// holocron.so. A caller may still point a build elsewhere by setting HOLOCRON_URL.
const GATEWAY_ORIGIN = 'https://agent.docs.automagik.dev'
process.env.HOLOCRON_URL ??= GATEWAY_ORIGIN

// Vite serves only public/, so the docs' own static folders are copied into the client
// output after it is written. These are the roots the public pages reference.
const STATIC_ROOTS = ['genie/images', 'genie/videos', 'captures/genie', 'logo', 'favicon.png']

function copyDocStatics(): Plugin {
  return {
    name: 'automagik-docs:copy-doc-statics',
    apply: 'build',
    applyToEnvironment: (environment) => environment.name === 'client',
    writeBundle() {
      const { root, build } = this.environment.config
      const outDir = path.resolve(root, build.outDir)
      for (const entry of STATIC_ROOTS) {
        fs.cpSync(path.join(root, entry), path.join(outDir, entry), {
          recursive: true,
          filter: (source) => !path.relative(root, source).includes('_internal'),
        })
      }
    },
  }
}

export default defineConfig({
  plugins: [
    holocron(),
    cloudflare({ viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] } }),
    copyDocStatics(),
  ],
  server: {
    // Vite's defaults, restated because setting the list replaces them, plus _internal.
    fs: {
      deny: [
        '.env',
        '.env.*',
        '*.{crt,pem,key,p12,pfx,cer,der}',
        '.npmrc',
        '.yarnrc.yml',
        '**/.git/**',
        '**/_internal/**',
      ],
    },
  },
})
