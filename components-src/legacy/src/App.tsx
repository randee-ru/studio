import mockData from '../mock/data.json'
import {
  mapBitrixIblockToLegacyProps,
  mapBitrixSiteToLegacyProps,
  mapBitrixToLegacyProps,
  mapConnectorToLegacyProps,
  mapJsonToLegacyProps,
  mapMockToLegacyProps
} from '../data.adapter'
import type { LegacyProps } from './types'
import './index.css'

export type LegacyStudioPreviewProps = {
  previewData?: unknown
  previewMode?: 'mock' | 'json' | 'bitrix-connector' | 'bitrix-site' | 'bitrix-iblock'
}

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

function resolvePreviewProps(previewData: unknown, previewMode?: LegacyStudioPreviewProps['previewMode']): LegacyProps {
  if (!previewData) {
    return mapMockToLegacyProps(mockData)
  }

  if (previewMode === 'json') {
    return mapJsonToLegacyProps(previewData as LegacyProps)
  }

  if (previewMode === 'bitrix-connector') {
    return mapConnectorToLegacyProps(previewData as { sections?: Array<{ NAME?: string; PREVIEW_TEXT?: string }>; title?: string; subtitle?: string })
  }

  if (previewMode === 'bitrix-site') {
    return mapBitrixSiteToLegacyProps(previewData as { arResult?: { TITLE?: string; SUBTITLE?: string; SECTIONS?: Array<{ NAME?: string; DETAIL_TEXT?: string }> } })
  }

  if (previewMode === 'bitrix-iblock') {
    return mapBitrixIblockToLegacyProps(previewData as { sections?: Array<{ NAME?: string; PREVIEW_TEXT?: string }> })
  }

  return mapBitrixToLegacyProps(previewData as LegacyProps)
}

export default function App(props: LegacyStudioPreviewProps = {}) {
  const previewProps = resolvePreviewProps(props.previewData, props.previewMode)
  return <LegacyTemplate {...previewProps} />
}
