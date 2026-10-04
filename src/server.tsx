// The site's custom entry (holocron's documented seam, website/src/pages/docs/custom-entry.mdx):
// holocron serves every docs page, and one site-wide layout adds the Genie pet to each route.
// Middleware and routes that must run before the docs go before `.use(holocronApp)`.
import { app as holocronApp } from '@holocron.so/vite/app'
import { Spiceflow } from 'spiceflow'
import { GeniePet } from '../components/genie-pet.tsx'
import { ProductBrand } from '../components/product-brand.tsx'
import docs from '../docs.json'
// holocron imports a root style.css only from its own default entry, so a custom entry
// imports it here, after holocron's styles.
import '../style.css'

// The products, from docs.json: each product's first navigation page is its landing (e.g.
// "omni/index"), that page's folder is its URL prefix, and its lowercased name is its slug.
type DocsProduct = { product: string; groups?: { pages?: unknown[] }[] }
const PRODUCTS: ReadonlyArray<{ prefix: string; slug: string; landing: string }> = (
  (docs.navigation?.products ?? []) as DocsProduct[]
).map((p) => {
  const first = String(p.groups?.[0]?.pages?.[0] ?? '')
  return { prefix: `/${first.split('/')[0]}`, slug: p.product.toLowerCase(), landing: `/${first}` }
})
const defaultProduct = PRODUCTS[0]?.slug ?? 'genie'

function productForPath(pathname: string): string {
  return PRODUCTS.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`))?.slug ?? defaultProduct
}

// JSON for an inline script: `<` is escaped so no value can close the script element.
const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c')
const productPrefixes = Object.fromEntries(PRODUCTS.map((p) => [p.prefix, p.slug]))
const productLandings = Object.fromEntries(PRODUCTS.map((p) => [p.slug, p.landing]))

// Runs before first paint: sets html[data-product] from the URL (style.css shows that
// product's logo), publishes the landings, and sends a click on the header logo to the
// current product's landing page. holocron's logo is a spiceflow <Link> to docs.json's
// logo.href, so the click is taken in the capture phase and routed with router.push
// (window.__genieNavigate, from components/product-brand.tsx), or a plain load before that
// module runs.
const productScript = `<script>(function(){var m=${inlineJson(productPrefixes)},L=${inlineJson(productLandings)},d=document.documentElement;function k(){var p=location.pathname,r=${inlineJson(defaultProduct)};for(var s in m)if(p===s||p.indexOf(s+"/")===0)r=m[s];return r}d.setAttribute("data-product",k());window.__genieProductLandings=L;addEventListener("click",function(e){var a=e.target&&e.target.closest&&e.target.closest(".slot-logo");if(!a||e.defaultPrevented||e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;var to=L[k()];if(!to)return;e.preventDefault();e.stopPropagation();if(window.__genieNavigate)window.__genieNavigate(to);else location.assign(to)},true)})()</script>`

// Every HTML document names its product on <html> (the header logo is right on first paint;
// <html> carries suppressHydrationWarning), carries the head script, and shares its product's
// logo as og:image and twitter:image. holocron points both tags at an /api/og renderer this
// site does not run; the first of each is rewritten and any further one removed. The rewriter
// streams, and every other response (RSC payloads, redirects, files) is returned untouched.
async function productMarks({ request }: { request: Request }, next: () => Promise<Response | undefined>) {
  const response = await next()
  if (!response?.headers.get('content-type')?.startsWith('text/html')) return response
  const { origin, pathname } = new URL(request.url)
  const slug = productForPath(pathname)
  const image = `${origin}/brand/${slug}-logo.png`
  const shareImage = () => {
    let seen = false
    return {
      element(meta: { setAttribute(name: string, value: string): unknown; remove(): unknown }) {
        if (seen) return meta.remove()
        seen = true
        meta.setAttribute('content', image)
      },
    }
  }
  return new HTMLRewriter()
    .on('html', { element: (html) => void html.setAttribute('data-product', slug) })
    .on('head', { element: (head) => void head.prepend(productScript, { html: true }) })
    .on('meta[property="og:image"]', shareImage())
    .on('meta[name="twitter:image"]', shareImage())
    .transform(response)
}

// Spiceflow orders layouts parent first, so a layout on `app` itself would be the outermost
// one. On a 404 every layout gets null children and only the outermost renders, which would
// replace holocron's not-found page with an empty document. Mounted after holocron, this
// layout is the innermost one: it wraps each page inside holocron's shell and stays out of
// the 404 root. GeniePet and ProductBrand render nothing: one mounts the pet on document.body,
// the other the product logo menu.
const siteLayout = new Spiceflow().layout('/*', ({ children }) => (
  <>
    {children}
    <GeniePet />
    <ProductBrand />
  </>
))

export const app = new Spiceflow().use(productMarks).use(holocronApp).use(siteLayout)

export default { fetch: (request: Request) => app.handle(request) }
