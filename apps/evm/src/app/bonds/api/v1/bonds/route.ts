import { BondsApiSchema, getBondsFromSubgraph } from '@sushiswap/client/api'
import { NextResponse } from 'next/server.js'
import { serialize } from 'sushi/bigint-serializer'
import { CORS } from '../../cors'

export const revalidate = 3

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const result = BondsApiSchema.safeParse(Object.fromEntries(searchParams))

  if (!result.success) {
    return NextResponse.json(result.error.format(), { status: 400 })
  }

  try {
    const bonds = await getBondsFromSubgraph(result.data)
    const stringified = serialize(bonds)

    return new NextResponse(stringified, {
      status: 200,
      headers: { 'content-type': 'application/json', ...CORS },
    })
  } catch (e) {
    return NextResponse.json(e, { headers: CORS })
  }
}
