export type SliderSlide = {
  title: string
  text: string
  accent?: string
}

export type SliderData = {
  title: string
  subtitle: string
  slides: SliderSlide[]
}

export type SliderProps = {
  title: string
  subtitle: string
  slides: SliderSlide[]
}

export function mapBitrixToSliderProps(data: SliderData): SliderProps {
  return {
    title: data.title,
    subtitle: data.subtitle,
    slides: data.slides.map((slide) => ({
      title: slide.title,
      text: slide.text,
      accent: slide.accent
    }))
  }
}

