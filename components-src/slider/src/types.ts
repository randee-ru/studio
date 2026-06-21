export type SliderSlide = {
  title: string
  text: string
  accent?: string
}

export type SliderProps = {
  title: string
  subtitle: string
  slides: SliderSlide[]
}

