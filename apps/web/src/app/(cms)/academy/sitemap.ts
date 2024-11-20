import { getAcademyArticles } from '@sushiswap/graph-client/strapi'
import type { MetadataRoute } from 'next'

export const revalidate = 0

const products = ['bentobox', 'furo', 'onsen', 'sushixswap']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const { articles } = await getAcademyArticles({
      pagination: { pageSize: 10000 },
    })

    return [
      {
        url: 'https://www.sushi.com/academy',
        lastModified: new Date(),
        changeFrequency: 'weekly',
      },
      {
        url: 'https://www.sushi.com/academy/explore',
        lastModified: new Date(),
        changeFrequency: 'weekly',
      },
      ...products.map(
        (product) =>
          ({
            url: `https://www.sushi.com/academy/products/${product}`,
            lastModified: new Date(),
            changeFrequency: 'monthly',
          }) as const,
      ),
      ...articles.map(
        (article) =>
          ({
            url: `https://www.sushi.com/academy/${article.slug}`,
            lastModified: new Date(article.updatedAt),
            changeFrequency: 'weekly',
          }) as const,
      ),
    ]
  } catch {
    console.error('sitemap: Error fetching academy articles')
    return []
  }
}