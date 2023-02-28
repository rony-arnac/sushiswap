import { client } from '@sushiswap/database'

// import { allChains, allProviders } from '@sushiswap/wagmi-config'
// import { Address, configureChains, createClient, fetchToken } from '@wagmi/core'

// const { provider } = configureChains(allChains, allProviders)
// createClient({
//   autoConnect: true,
//   provider,
// })

// export async function getToken(chainId: number, address: string) {
//   try {
//     const token = await client.token.findFirstOrThrow({
//       select: {
//         id: true,
//         address: true,
//         name: true,
//         symbol: true,
//         decimals: true,
//         isCommon: true,
//         isFeeOnTransfer: true,
//       },
//       where: {
//         AND: {
//           chainId,
//           address,
//           status: 'APPROVED',
//         },
//       },
//     })
//     await client.$disconnect()
//     return token
//   } catch (e) {
//     console.log(`Token not found in db: ${address} on chain ${chainId}`, e)
//   }

//   try {
//     const token = await fetchToken({ chainId, address: address as Address })
//     return token
//   } catch (e) {
//     console.log(`Token fetch fallback failed: ${address} on chain ${chainId}`, e)
//   }

//   throw new Error('Token not found')
// }

export async function getToken(chainId: number, address: string) {
  const token = await client.token.findFirstOrThrow({
    select: {
      id: true,
      address: true,
      name: true,
      symbol: true,
      decimals: true,
      isCommon: true,
      isFeeOnTransfer: true,
    },
    where: {
      AND: {
        chainId,
        address,
        status: 'APPROVED',
      },
    },
  })
  await client.$disconnect()
  return token
}

export async function getTokenIdsByChainId(chainId: number) {
  const ids = await client.token.findMany({
    select: {
      id: true,
    },
    where: {
      AND: {
        chainId,
        status: 'APPROVED',
      },
    },
  })
  await client.$disconnect()
  return ids ? ids : []
}

export async function getTokenAddressesByChainId(chainId: number) {
  const addresses = await client.token.findMany({
    select: {
      address: true,
    },
    where: {
      AND: {
        chainId,
        status: 'APPROVED',
      },
    },
  })
  await client.$disconnect()
  return addresses ? addresses : []
}

export async function getTokensByChainId(chainId: number) {
  const tokens = await client.token.findMany({
    select: {
      id: true,
      address: true,
      name: true,
      symbol: true,
      decimals: true,
      isCommon: true,
      isFeeOnTransfer: true,
    },
    where: {
      AND: {
        chainId,
        status: 'APPROVED',
      },
    },
  })
  await client.$disconnect()
  return tokens ? tokens : []
}

export async function getTokens() {
  const tokens = await client.token.findMany({
    select: {
      id: true,
      address: true,
      chainId: true,
      name: true,
      symbol: true,
      decimals: true,
      isCommon: true,
      isFeeOnTransfer: true,
    },
    where: {
      AND: {
        status: 'APPROVED',
      },
    },
  })
  await client.$disconnect()
  return tokens ? tokens : []
}
