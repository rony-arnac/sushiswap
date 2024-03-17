import { Address } from 'viem'
import { RPool } from '../tines'

export class TokenVert {
  token: Address
  pools: PoolEdge[] = []
  price?: number | undefined
  obj?: object | undefined

  constructor(token: Address) {
    this.token = token
  }

  getNeibour(edge: PoolEdge) {
    const token0 = edge.token0
    return token0 === this ? edge.token1 : token0
  }
}

export class PoolEdge {
  pool: RPool
  token0: TokenVert
  token1: TokenVert
  poolLiquidity = 0

  constructor(pool: RPool, token0: TokenVert, token1: TokenVert) {
    this.pool = pool
    this.token0 = token0
    this.token1 = token1
  }

  reserve(token: TokenVert) {
    return token === this.token0
      ? this.pool.getReserve0()
      : this.pool.getReserve1()
  }
}

export function makePoolTokenGraph(
  pools: RPool[],
  baseTokens: Address[],
): (TokenVert | undefined)[] {
  // const vertices: TokenVert = []
  // const edges: PoolEdge = []
  const tokens: Map<Address, TokenVert> = new Map()
  pools.forEach((p) => {
    // TokenVert for p.token0 finding or creation
    const addr0 = p.token0.address as Address
    let v0 = tokens.get(addr0)
    if (v0 === undefined) {
      v0 = new TokenVert(addr0)
      tokens.set(addr0, v0)
    }

    // TokenVert for p.token1 finding or creation
    const addr1 = p.token1.address as Address
    let v1 = tokens.get(addr1)
    if (v1 === undefined) {
      v1 = new TokenVert(addr1)
      tokens.set(addr1, v1)
    }

    const edge = new PoolEdge(p, v0, v1)
    v0.pools.push(edge)
    v1.pools.push(edge)
  })

  return baseTokens.map((t) => tokens.get(t))
}
