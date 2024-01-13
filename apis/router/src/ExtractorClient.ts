import { PoolCode, deserializePoolCodesJSON } from '@sushiswap/router'
import {
  ADDITIONAL_BASES,
  BASES_TO_CHECK_TRADES_AGAINST,
} from '@sushiswap/router-config'
import { ChainId } from 'sushi/chain'
import { Native, Token, Type } from 'sushi/currency'

function tokenAddr(t: Type) {
  return t.isNative ? '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE' : t.address
}

function tokenId(t: string | Type) {
  if (typeof t === 'string') return t.toLowerCase()
  if (t.isNative) return '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  return t.address.toLowerCase()
}

function tokenPairId(t0: string | Type, t1: string | Type) {
  const id0 = tokenId(t0)
  const id1 = tokenId(t1)
  return id0 < id1 ? id0 + id1 : id1 + id0
}

export class ExtractorClient {
  chainId: ChainId
  extractorServer: string
  poolUpdateInterval: number
  lastUpdatedTimestamp = 0
  tokenMap: Map<string, Token> = new Map()
  poolCodesMap: Map<string, PoolCode[]> = new Map()
  fetchPoolsBetweenRequests: Set<string> = new Set()

  constructor(
    chainId: ChainId,
    extractorServer: string,
    poolUpdateInterval: number,
  ) {
    this.chainId = chainId
    this.extractorServer = extractorServer
    this.poolUpdateInterval = poolUpdateInterval
  }

  start() {
    this.updatePools()
  }

  async updatePools() {
    try {
      const resp = await fetch(
        `${this.extractorServer}/pools-json/${this.chainId}`,
      )
      if (resp.status === 200) {
        const data = await resp.text()
        const pools = deserializePoolCodesJSON(data)
        this.poolCodesMap.clear()
        this.tokenMap.clear()
        pools.forEach((p) => {
          const t0 = p.pool.token0
          const t0Id = tokenId(t0.address)
          if (this.tokenMap.get(t0Id) === undefined)
            this.tokenMap.set(t0Id, new Token({ ...t0, chainId: this.chainId }))

          const t1 = p.pool.token1
          const t1Id = tokenId(t1.address)
          if (this.tokenMap.get(t1Id) === undefined)
            this.tokenMap.set(t1Id, new Token({ ...t1, chainId: this.chainId }))

          const id = tokenPairId(t0.address, t1.address)
          const pl = this.poolCodesMap.get(id)
          if (pl === undefined) this.poolCodesMap.set(id, [p])
          else pl.push(p)
        })
        this.lastUpdatedTimestamp = Date.now()
      } else {
        console.error(`Pool download failed, status=${resp.status}`)
      }
    } catch (e) {
      console.error(`Pool download failed, ${e}`)
    }
    setTimeout(() => this.updatePools(), this.poolUpdateInterval)
  }

  // fetch pools for the pair if we didn't do it previously
  async fetchPoolsBetween(t0: Type, t1: Type) {
    const id = tokenPairId(t0, t1)
    if (this.poolCodesMap.get(id) !== undefined) return
    if (this.fetchPoolsBetweenRequests.has(id)) return // already fetched

    this.fetchPoolsBetweenRequests.add(id)
    const resp = await fetch(
      `${this.extractorServer}/pools-between/${tokenAddr(t0)}/${tokenAddr(t1)}`,
    )
    this.fetchPoolsBetweenRequests.delete(id)

    if (resp.status !== 200) return
    const pools = (await resp.json()) as PoolCode[]
    this.poolCodesMap.set(id, pools)
    return pools
  }

  async fetchTokenPools(t: string | Type) {
    const addr = typeof t === 'string' ? t : tokenAddr(t)
    const resp = await fetch(`${this.extractorServer}/pools-for-token/${addr}`)
    if (resp.status !== 200) return
    const pools = (await resp.json()) as PoolCode[]
    pools.forEach((p) => {
      const t0 = p.pool.token0
      const t1 = p.pool.token1
      const id = tokenPairId(t0.address, t1.address)
      const pl = this.poolCodesMap.get(id)
      if (pl === undefined) this.poolCodesMap.set(id, [p])
      else pl.push(p)
    })
    return pools
  }

  getKnownPoolsForTokens(t0: Type, t1: Type): Map<string, PoolCode> {
    this.fetchPoolsBetween(t0, t1)
    const tokens = this._getTokenListSorted(t0, t1)
    const pools: Map<string, PoolCode> = new Map()
    for (let i = 0; i < tokens.length; ++i) {
      for (let j = i + 1; j < tokens.length; ++j) {
        const pairPools = this.poolCodesMap.get(
          // @ts-ignore
          tokenPairId(tokens[i], tokens[j]),
        )
        if (pairPools !== undefined)
          pairPools.forEach((p) => pools.set(p.pool.uniqueID(), p))
      }
    }
    return pools
  }

  getToken(addr: string): Type | Promise<Type | undefined> {
    const addrL = addr.toLowerCase()
    if (addrL === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee')
      return Native.onChain(this.chainId)
    const token = this.tokenMap.get(addrL)
    if (token !== undefined) return token
    return this.fetchToken(addr)
  }

  async fetchToken(addr: string): Promise<Token | undefined> {
    const resp = await fetch(`${this.extractorServer}/token/${addr}`)
    if (resp.status === 422) return // token don't exist
    if (resp.status !== 200)
      throw new Error(`Extractor server error ${resp.status}`)
    const data = (await resp.json()) as Token
    return new Token({ ...data })
  }

  _getTokenListSorted(t0: Type, t1: Type): Type[] {
    const common = BASES_TO_CHECK_TRADES_AGAINST[this.chainId] ?? []
    const additionalA =
      ADDITIONAL_BASES[this.chainId]?.[t0.wrapped.address] ?? []
    const additionalB =
      ADDITIONAL_BASES[this.chainId]?.[t1.wrapped.address] ?? []

    const tokensSorted = [
      Native.onChain(this.chainId),
      t0.wrapped,
      t1.wrapped,
      ...common,
      ...additionalA,
      ...additionalB,
    ].sort((t0, t1) => (tokenId(t0) < tokenId(t1) ? -1 : 1))
    const tokensUnique: Type[] = []
    tokensSorted.forEach((t) => {
      if (tokensUnique.length === 0) tokensUnique.push(t)
      // @ts-ignore
      else if (tokenId(tokensUnique[tokensUnique.length - 1]) !== tokenId(t))
        tokensUnique.push(t)
    })

    return tokensUnique
  }
}
