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

export type SliderSourceMode = 'mock' | 'json' | 'bitrix-connector' | 'bitrix-site' | 'bitrix-iblock'

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

export function mapMockToSliderProps(data: SliderData): SliderProps {
  return mapBitrixToSliderProps(data)
}

export function mapJsonToSliderProps(data: SliderData): SliderProps {
  return mapBitrixToSliderProps(data)
}

export function mapConnectorToSliderProps(data: {
  items?: Array<{ NAME?: string; PREVIEW_TEXT?: string; PREVIEW_PICTURE?: string }>
  title?: string
  subtitle?: string
}): SliderProps {
  return {
    title: data.title ?? 'Slider',
    subtitle: data.subtitle ?? 'Connector data source',
    slides: (data.items ?? []).map((item, index) => ({
      title: item.NAME ?? `Slide ${index + 1}`,
      text: item.PREVIEW_TEXT ?? '',
      accent: item.PREVIEW_PICTURE ? 'rgba(141, 209, 255, 0.24)' : undefined
    }))
  }
}

export function mapBitrixSiteToSliderProps(data: {
  arResult?: { TITLE?: string; SUBTITLE?: string; ITEMS?: Array<{ NAME?: string; DETAIL_TEXT?: string }> }
}): SliderProps {
  return {
    title: data.arResult?.TITLE ?? 'Slider',
    subtitle: data.arResult?.SUBTITLE ?? 'Bitrix site data source',
    slides: (data.arResult?.ITEMS ?? []).map((item, index) => ({
      title: item.NAME ?? `Slide ${index + 1}`,
      text: item.DETAIL_TEXT ?? ''
    }))
  }
}

export function mapBitrixIblockToSliderProps(data: {
  items?: Array<{ NAME?: string; PREVIEW_TEXT?: string; PREVIEW_PICTURE?: string }>
}): SliderProps {
  return mapConnectorToSliderProps({ items: data.items, title: 'Slider', subtitle: 'Iblock data source' })
}
