'use client'

import { Container } from '@sushiswap/ui'

import { ChartSection } from './components/ChartSection'
import { FilterProvider } from './components/Filters/FilterProvider'
import { TableSection } from './components/TableSection'

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-10">
      <Container maxWidth="7xl" className="px-4 mx-auto">
        <section className="flex flex-col gap-6 lg:flex-row">
          <div className="max-w-md space-y-4">
            <h2 className="text-2xl font-semibold text-slate-50">Sushi Analytics</h2>
            <p className="text-slate-300">
              Analytics platform for tracking the liquidity, volume, and fees generated by Sushi products.
            </p>
          </div>
        </section>
      </Container>
      <FilterProvider>
        <ChartSection />
        <TableSection />
      </FilterProvider>
    </div>
  )
}