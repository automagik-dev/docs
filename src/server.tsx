// The site's custom entry (holocron's documented seam, website/src/pages/docs/custom-entry.mdx):
// holocron serves every docs page, and one site-wide layout adds the Genie pet to each route.
// Middleware and routes that must run before the docs go before `.use(holocronApp)`.
import { app as holocronApp } from '@holocron.so/vite/app'
import { Spiceflow } from 'spiceflow'
import { GeniePet } from '../components/genie-pet.tsx'
// holocron imports a root style.css only from its own default entry, so a custom entry
// imports it here, after holocron's styles.
import '../style.css'

// Spiceflow orders layouts parent first, so a layout on `app` itself would be the outermost
// one. On a 404 every layout gets null children and only the outermost renders, which would
// replace holocron's not-found page with an empty document. Mounted after holocron, this
// layout is the innermost one: it wraps each page inside holocron's shell and stays out of
// the 404 root. GeniePet renders nothing and mounts the pet on document.body.
const siteLayout = new Spiceflow().layout('/*', ({ children }) => (
  <>
    {children}
    <GeniePet />
  </>
))

export const app = new Spiceflow().use(holocronApp).use(siteLayout)

export default { fetch: (request: Request) => app.handle(request) }
