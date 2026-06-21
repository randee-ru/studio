import type { CSSProperties } from 'react'
import mockData from '../mock/data.json'
import {
  mapBitrixIblockToSliderProps,
  mapBitrixSiteToSliderProps,
  mapBitrixToSliderProps,
  mapConnectorToSliderProps,
  mapJsonToSliderProps,
  mapMockToSliderProps,
  type SliderSourceMode
} from '../data.adapter'
import type { SliderProps } from './types'
import './index.css'

export type SliderStudioPreviewProps = {
  previewData?: unknown
  previewMode?: SliderSourceMode
}

function Slider({ title, subtitle, slides }: SliderProps) {
  return (
    <section className="randee-slider-shell">
      <div className="randee-slider__hero">
        <p className="randee-slider__eyebrow">Randee Components</p>
        <h1>{title}</h1>
        <p className="randee-slider__subtitle">{subtitle}</p>
      </div>

      <div className="randee-slider__track">
        {slides.map((slide, index) => (
          <article
            key={`${slide.title}-${index}`}
            className="randee-slider__slide"
            style={{ '--accent': slide.accent ?? 'rgba(255,255,255,0.12)' } as CSSProperties}
          >
            <span className="randee-slider__index">{String(index + 1).padStart(2, '0')}</span>
            <h2>{slide.title}</h2>
            <p>{slide.text}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function resolvePreviewProps(previewData: unknown, previewMode?: SliderSourceMode): SliderProps {
  if (!previewData) {
    return mapMockToSliderProps(mockData)
  }

  if (previewMode === 'json') {
    return mapJsonToSliderProps(previewData as SliderProps & { title: string; subtitle: string; slides: SliderProps['slides'] })
  }

  if (previewMode === 'bitrix-connector') {
    return mapConnectorToSliderProps(previewData as { items?: Array<{ NAME?: string; PREVIEW_TEXT?: string; PREVIEW_PICTURE?: string }>; title?: string; subtitle?: string })
  }

  if (previewMode === 'bitrix-site') {
    return mapBitrixSiteToSliderProps(previewData as { arResult?: { TITLE?: string; SUBTITLE?: string; ITEMS?: Array<{ NAME?: string; DETAIL_TEXT?: string }> } })
  }

  if (previewMode === 'bitrix-iblock') {
    return mapBitrixIblockToSliderProps(previewData as { items?: Array<{ NAME?: string; PREVIEW_TEXT?: string; PREVIEW_PICTURE?: string }> })
  }

  return mapBitrixToSliderProps(previewData as SliderProps & { title: string; subtitle: string; slides: SliderProps['slides'] })
}

export default function App(props: SliderStudioPreviewProps = {}) {
  const previewProps = resolvePreviewProps(props.previewData, props.previewMode)
  return <Slider {...previewProps} />
}
