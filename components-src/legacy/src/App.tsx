import mockData from '../mock/data.json'
import { mapMockToLegacyProps } from '../data.adapter'
import type { LegacyProps } from './types'
import './index.css'

function LegacyTemplate({ title, subtitle, sections }: LegacyProps) {
  return (
    <main className="randee-legacy-shell">
      <header className="randee-legacy__hero">
        <p className="randee-legacy__eyebrow">Randee Template</p>
        <h1>{title}</h1>
        <p className="randee-legacy__subtitle">{subtitle}</p>
      </header>

      <section className="randee-legacy__grid">
        {sections.map((section) => (
          <article key={section.title} className="randee-legacy__card">
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
      </section>

      <footer className="randee-legacy__footer">
        <span>Footer area</span>
        <span>Bitrix-ready template scaffold</span>
      </footer>
    </main>
  )
}

export default function App() {
  const props = mapMockToLegacyProps(mockData)
  return <LegacyTemplate {...props} />
}
