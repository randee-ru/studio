import type { CSSProperties } from 'react'
import mockData from '../mock/data.json'
import { mapBitrixToSliderProps } from '../data.adapter'
import type { SliderProps } from './types'
import './index.css'

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

export default function App() {
  const props = mapBitrixToSliderProps(mockData)
  return <Slider {...props} />
}
