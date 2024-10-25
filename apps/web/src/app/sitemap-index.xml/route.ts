import { CHAIN_IDS } from 'src/config'
import { getNetworkKey } from 'src/lib/network'

const networkKeys = [...CHAIN_IDS.map(getNetworkKey), 'aptos', 'tron']

const sitemapFiles = [
  '/academy/sitemap.xml',
  '/blog/sitemap.xml',
  ...networkKeys.map((key) => `/sitemap/${key}.xml`),
  '/legal/sitemap.xml',
]

const generateSitemapLink = (url: string) =>
  `<sitemap><loc>https://sushi.com${url}</loc></sitemap>`

export async function GET() {
  const sitemapIndexXML = `<?xml version="1.0" encoding="UTF-8"?>
    <sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${sitemapFiles.map((file) => generateSitemapLink(file)).join('')}
    </sitemapindex>`

  return new Response(sitemapIndexXML, {
    headers: { 'Content-Type': 'text/xml' },
  })
}
